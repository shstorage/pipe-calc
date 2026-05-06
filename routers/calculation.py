import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database.db import get_db
from database.models import PipeSchedule, AllowableStress

router = APIRouter(prefix="/api", tags=["calculation"])

_UNS_RE = re.compile(r'^[A-Z]\d{5}$')


class CalcRequest(BaseModel):
    edition: str | None = None
    spec_no: str
    grade: str
    type_or_class: str = ""
    design_pressure_barg: float
    temperature_c: float
    corrosion_allowance_mm: float = 0.0
    mill_tolerance_pct: float = 12.5
    joint_efficiency: float = 1.0
    y_coefficient: float | None = None       # None → Table 104.1.2-1 자동
    weld_strength_factor: float | None = None  # None → Table 102.4.7-1 자동
    pipe_standard: str = "B36.10"


# B31.1 Table 104.1.2-1 Values of y  (temp: °C, interpolated per note (a))
_Y_FERRITIC = [
    (482, 0.4), (510, 0.5), (538, 0.7), (566, 0.7),
    (593, 0.7), (621, 0.7), (649, 0.7), (677, 0.7),
]
_Y_AUSTENITIC = [
    (482, 0.4), (510, 0.4), (538, 0.4), (566, 0.4),
    (593, 0.5), (621, 0.7), (649, 0.7), (677, 0.7),
]


def _interp(table: list[tuple[float, float]], temp_c: float) -> float:
    if temp_c <= table[0][0]:
        return table[0][1]
    if temp_c >= table[-1][0]:
        return table[-1][1]
    for i in range(len(table) - 1):
        t0, v0 = table[i]
        t1, v1 = table[i + 1]
        if t0 <= temp_c <= t1:
            return v0 + (v1 - v0) * (temp_c - t0) / (t1 - t0)
    return table[-1][1]


def _y_coeff(p_no: str | None, temp_c: float) -> float:
    """B31.1 Table 104.1.2-1: P-No.8 → Austenitic, 나머지 → Ferritic."""
    table = _Y_AUSTENITIC if str(p_no or "") == "8" else _Y_FERRITIC
    return _interp(table, temp_c)


# B31.1 Table 102.4.7-1 Weld Strength Reduction Factors  (temp: °C)
# 482°C(900°F) 이하 전 재질 W=1.0
_W_TABLES: dict[str, list[tuple[float, float]]] = {
    # P-No. 1: Carbon Steel
    "1":  [(482, 1.000), (510, 0.954), (538, 0.909), (566, 0.863),
           (593, 0.818), (621, 0.773), (649, 0.727), (677, 0.682), (704, 0.636)],
    # P-No. 3: C-Mo Steel
    "3":  [(482, 1.000), (510, 1.000), (538, 0.952), (566, 0.905),
           (593, 0.857), (621, 0.810), (649, 0.762), (677, 0.714), (704, 0.667)],
    # P-No. 4: 1Cr-0.5Mo, 1.25Cr-0.5Mo, 2.25Cr-1Mo
    "4":  [(482, 1.000), (510, 1.000), (538, 1.000), (566, 0.952),
           (593, 0.905), (621, 0.857), (649, 0.810), (677, 0.762), (704, 0.714)],
    # P-No. 5A: 5Cr-0.5Mo
    "5A": [(482, 1.000), (510, 1.000), (538, 1.000), (566, 1.000),
           (593, 0.952), (621, 0.905), (649, 0.857), (677, 0.810), (704, 0.762)],
    # P-No. 5B: 9Cr-1Mo-V (Grade 91)
    "5B": [(482, 1.000), (510, 1.000), (538, 1.000), (566, 1.000),
           (593, 1.000), (621, 1.000), (649, 1.000), (677, 0.952), (704, 0.905)],
    # P-No. 6: 12Cr Martensitic SS
    "6":  [(482, 1.000), (510, 1.000), (538, 1.000), (566, 1.000),
           (593, 1.000), (621, 0.952), (649, 0.905), (677, 0.857)],
    # P-No. 8: Austenitic SS → W=1.0 (longitudinal weld creep-equal to base metal)
    "8":  [(482, 1.000)],
}


def _w_factor(p_no: str | None, temp_c: float) -> float:
    """B31.1 Table 102.4.7-1: P-No. 기반 WSRF. 482°C 이하는 항상 1.0."""
    if temp_c <= 482:
        return 1.0
    table = _W_TABLES.get(str(p_no or ""), [(482, 1.000)])
    if len(table) == 1:
        return 1.0
    return _interp(table, temp_c)


def _mat_label(spec_no: str, grade: str, type_or_class: str) -> str:
    toc = (type_or_class or "").strip()
    base = f"{spec_no} {grade}"
    if not toc or _UNS_RE.match(toc):
        return base
    short = {"S": "Seamless", "ERW": "ERW", "EFW": "EFW"}.get(toc, toc)
    return f"{base} ({short})"


def interpolate_stress(rows: list, temp: float) -> float:
    sorted_rows = sorted(rows, key=lambda r: r.temp_c)
    if temp <= sorted_rows[0].temp_c:
        return sorted_rows[0].stress_mpa
    if temp >= sorted_rows[-1].temp_c:
        return sorted_rows[-1].stress_mpa
    for i in range(len(sorted_rows) - 1):
        t0, t1 = sorted_rows[i].temp_c, sorted_rows[i + 1].temp_c
        if t0 <= temp <= t1:
            s0, s1 = sorted_rows[i].stress_mpa, sorted_rows[i + 1].stress_mpa
            return s0 + (s1 - s0) * (temp - t0) / (t1 - t0)
    return sorted_rows[-1].stress_mpa


@router.post("/calculate")
def calculate(req: CalcRequest, db: Session = Depends(get_db)):
    q = db.query(AllowableStress).filter(
        AllowableStress.code == "B31.1",
        AllowableStress.spec_no == req.spec_no,
        AllowableStress.grade == req.grade,
        AllowableStress.type_or_class == (req.type_or_class or ""),
    )
    if req.edition:
        q = q.filter(AllowableStress.edition == req.edition)
    stress_rows = q.all()
    if not stress_rows:
        label = _mat_label(req.spec_no, req.grade, req.type_or_class)
        raise HTTPException(
            status_code=404,
            detail=f"허용응력 데이터 없음: B31.1, material={label}",
        )

    S = interpolate_stress(stress_rows, req.temperature_c)
    p_no = stress_rows[0].p_no
    P = req.design_pressure_barg * 0.1  # barg → MPa (1 bar = 0.1 MPa)
    E = req.joint_efficiency
    Y = req.y_coefficient if req.y_coefficient is not None else _y_coeff(p_no, req.temperature_c)
    W = req.weld_strength_factor if req.weld_strength_factor is not None else _w_factor(p_no, req.temperature_c)
    c = req.corrosion_allowance_mm
    tol = req.mill_tolerance_pct / 100.0

    pipes = (
        db.query(PipeSchedule)
        .filter(PipeSchedule.standard == req.pipe_standard)
        .order_by(PipeSchedule.dn, PipeSchedule.wt_mm)
        .all()
    )

    dn_groups: dict[int, list] = {}
    for p in pipes:
        dn_groups.setdefault(p.dn, []).append(p)

    results = []
    for dn, group in sorted(dn_groups.items()):
        od = group[0].od_mm
        nps = group[0].nps

        # B31.1 Eq.(3): t = P·D / (2·(S·E·W + P·Y)) + c
        t_req = (P * od) / (2 * (S * E * W + P * Y)) + c
        t_nominal = t_req / (1 - tol) if tol > 0 else t_req

        satisfied = [p for p in group if p.wt_mm >= t_nominal]
        satisfied.sort(key=lambda p: p.wt_mm)

        results.append({
            "dn": dn,
            "nps": nps,
            "od_mm": od,
            "t_required_mm": round(t_req, 3),
            "t_nominal_mm": round(t_nominal, 3),
            "satisfied_schedules": [
                {
                    "schedule": p.schedule or f"WT {p.wt_mm}mm",
                    "wt_mm": p.wt_mm,
                    "is_minimum": i == 0,
                }
                for i, p in enumerate(satisfied)
            ],
        })

    return {
        "results": results,
        "allowable_stress_mpa": round(S, 2),
        "y_coefficient": round(Y, 3),
        "w_factor": round(W, 3),
    }


@router.get("/materials")
def get_materials(
    code: str | None = None,
    edition: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(
        AllowableStress.spec_no,
        AllowableStress.grade,
        AllowableStress.type_or_class,
        AllowableStress.nominal_comp,
        AllowableStress.p_no,
        AllowableStress.edition,
    ).distinct()
    if code:
        q = q.filter(AllowableStress.code == code)
    if edition:
        q = q.filter(AllowableStress.edition == edition)
    return [
        {
            "spec_no": r.spec_no,
            "grade": r.grade,
            "type_or_class": r.type_or_class or "",
            "nominal_comp": r.nominal_comp or "",
            "p_no": r.p_no or "",
            "edition": r.edition or "",
            "label": _mat_label(r.spec_no, r.grade, r.type_or_class),
            "key": f"{r.spec_no}||{r.grade}||{r.type_or_class or ''}",
        }
        for r in q.all()
    ]
