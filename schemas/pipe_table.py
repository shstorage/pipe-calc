from pydantic import BaseModel
from typing import Optional


class PipeScheduleOut(BaseModel):
    id: int
    standard: str
    dn: int
    nps: float
    schedule: Optional[str] = None
    identification: Optional[str] = None
    od_mm: float
    wt_mm: float
    mass_kg_m: Optional[float] = None
    od_in: Optional[float] = None
    wt_in: Optional[float] = None
    mass_lb_ft: Optional[float] = None

    model_config = {"from_attributes": True}
