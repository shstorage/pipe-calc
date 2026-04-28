from pydantic import BaseModel


class PipeScheduleOut(BaseModel):
    id: int
    standard: str
    dn: int
    nps: float
    schedule: str
    od_mm: float
    wt_mm: float

    model_config = {"from_attributes": True}
