from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database.db import get_db
from database.models import PipeSchedule, AllowableStress

router = APIRouter(prefix="/api", tags=["calculation"])


class CalcRequest(BaseModel):
    code: str
    material: str
    design_pressure_mpa: float
    temperature_c: float
    corrosion_allowance_mm: float = 1.5
    joint_efficiency: float = 1.0
    y_coefficient: float = 0.4
    weld_strength_factor: float = 1.0


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
    stress_rows = (
        db.query(AllowableStress)
        .filter(AllowableStress.code == req.code, AllowableStress.material == req.material)
        .all()
    )
    if not stress_rows:
        raise HTTPException(
            status_code=404,
            detail=f"허용응력 데이터 없음: code={req.code}, material={req.material}",
        )

    S = interpolate_stress(stress_rows, req.temperature_c)
    P = req.design_pressure_mpa
    E = req.joint_efficiency
    Y = req.y_coefficient
    W = req.weld_strength_factor
    c = req.corrosion_allowance_mm

    pipes = (
        db.query(PipeSchedule)
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

        satisfied = [p for p in group if p.wt_mm >= t_req]
        satisfied.sort(key=lambda p: p.wt_mm)

        schedule_list = []
        for i, p in enumerate(satisfied):
            schedule_list.append(
                {
                    "schedule": p.schedule or f"WT {p.wt_mm}mm",
                    "wt_mm": p.wt_mm,
                    "is_minimum": i == 0,
                }
            )

        results.append(
            {
                "dn": dn,
                "nps": nps,
                "od_mm": od,
                "t_required_mm": round(t_req, 3),
                "allowable_stress_mpa": round(S, 2),
                "satisfied_schedules": schedule_list,
            }
        )

    return {"results": results}


@router.get("/materials")
def get_materials(code: str | None = None, db: Session = Depends(get_db)):
    q = db.query(AllowableStress.material).distinct()
    if code:
        q = q.filter(AllowableStress.code == code)
    return [r[0] for r in q.all()]
