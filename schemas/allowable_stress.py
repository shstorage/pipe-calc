from pydantic import BaseModel


class AllowableStressOut(BaseModel):
    id: int
    code: str
    edition: str | None
    spec_no: str
    grade: str
    type_or_class: str
    nominal_comp: str | None
    p_no: str | None
    temp_c: float
    stress_mpa: float
    is_creep: int

    model_config = {"from_attributes": True}
