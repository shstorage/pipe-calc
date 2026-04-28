from pydantic import BaseModel


class AllowableStressOut(BaseModel):
    id: int
    code: str
    material: str
    temp_c: float
    stress_mpa: float

    model_config = {"from_attributes": True}
