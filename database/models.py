from sqlalchemy import Column, Integer, Float, Text, UniqueConstraint
from database.db import Base


class PipeSchedule(Base):
    __tablename__ = "pipe_schedule"

    id = Column(Integer, primary_key=True, autoincrement=True)
    standard = Column(Text, nullable=False)
    dn = Column(Integer, nullable=False)
    nps = Column(Float, nullable=False)
    schedule = Column(Text, nullable=True)
    identification = Column(Text, nullable=True)
    od_mm = Column(Float, nullable=False)
    wt_mm = Column(Float, nullable=False)
    mass_kg_m = Column(Float, nullable=True)
    od_in = Column(Float, nullable=True)
    wt_in = Column(Float, nullable=True)
    mass_lb_ft = Column(Float, nullable=True)

    __table_args__ = (UniqueConstraint("standard", "dn", "wt_mm"),)


class AllowableStress(Base):
    __tablename__ = "allowable_stress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(Text, nullable=False)          # B31.1, B31.3
    edition = Column(Text, nullable=True)        # 2022, 2020, 2018 …
    spec_no = Column(Text, nullable=False)       # A106, A335, A312
    grade = Column(Text, nullable=False)         # B, P11, P91, TP304
    type_or_class = Column(Text, nullable=False, default="")  # S, Type 1, S30400, ""
    nominal_comp = Column(Text, nullable=True)   # C-Si, 9Cr-1Mo-V
    p_no = Column(Text, nullable=True)           # 1, 4, 5A, 5B, 8, 15E
    temp_c = Column(Float, nullable=False)
    stress_mpa = Column(Float, nullable=False)
    is_creep = Column(Integer, nullable=False, default=0)  # 0=non-creep, 1=creep range

    __table_args__ = (
        UniqueConstraint("code", "edition", "spec_no", "grade", "type_or_class", "temp_c"),
    )
