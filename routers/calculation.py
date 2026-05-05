import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database.db import get_db
from database.models import PipeSchedule, AllowableStress

router = APIRouter(prefix="/api", tags=["calculation"])

_UNS_RE = re.compile(r'^[A-Z]\d{5}$')


class CalcRequest(BaseModel):
    code: str = "B31.1"
    edition: str | None = None          # None → 최신(edition 무관)
    spec_no: str
    grade: str
    type_or_class: str = ""
    design_pressure_mpa: float
    temperature_c: float
    corrosion_allowance_mm: float = 0.0
    mill_tolerance_pct: float = 12.5
    joint_efficiency: float = 1.0       # E — 용접 이음 효율 (Seamless=1.0, ERW=0.85 등)
    y_coefficient: float | None = None  # None → B31.1 Table 104.1.2(A) 자동 계산
    weld_strength_factor: float = 1.0   # W — B31.3 전용
    pipe_standard: str = "B36.10"


def _y_coeff(p_no: str | None, temp_c: float) -> float:
    """B31.1 Table 104.1.2(A) Y 계수 자동 계산."""
    t_f = temp_c * 9 / 5 + 32
    if t_f <= 900:
        return 0.4
    if str(p_no or "") == "8":  # Austenitic SS
        if t_f <= 1050:
            return 0.4
        if t_f <= 1100:
            return 0.5
        return 0.7
    else:  # Ferritic/other
        if t_f <= 950:
            return 0.5
        return 0.7


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
        AllowableStress.code == req.code,
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
            detail=f"허용응력 데이터 없음: code={req.code}, material={label}",
        )

    S = interpolate_stress(stress_rows, req.temperature_c)
    p_no = stress_rows[0].p_no
    P = req.design_pressure_mpa
    E = req.joint_efficiency
    Y = req.y_coefficient if req.y_coefficient is not None else _y_coeff(p_no, req.temperature_c)
    W = req.weld_strength_factor
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

        if req.code == "B31.1":
            t_req = (P * od) / (2 * (S * E + P * Y)) + c
        else:
            t_req = (P * od) / (2 * (S * E * W + P * Y)) + c

        t_nominal = t_req / (1 - tol) if tol > 0 else t_req

        satisfied = [p for p in group if p.wt_mm >= t_nominal]
        satisfied.sort(key=lambda p: p.wt_mm)

        schedule_list = [
            {
                "schedule": p.schedule or f"WT {p.wt_mm}mm",
                "wt_mm": p.wt_mm,
                "is_minimum": i == 0,
            }
            for i, p in enumerate(satisfied)
        ]

        results.append(
            {
                "dn": dn,
                "nps": nps,
                "od_mm": od,
                "t_required_mm": round(t_req, 3),
                "t_nominal_mm": round(t_nominal, 3),
                "allowable_stress_mpa": round(S, 2),
                "y_used": round(Y, 2),
                "satisfied_schedules": schedule_list,
            }
        )

    return {"results": results, "y_coefficient": round(Y, 2)}


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
