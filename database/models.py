from sqlalchemy import Column, Integer, Float, Text, UniqueConstraint
from database.db import Base


class PipeSchedule(Base):
    __tablename__ = "pipe_schedule"

    id = Column(Integer, primary_key=True, autoincrement=True)
    standard = Column(Text, nullable=False)
    dn = Column(Integer, nullable=False)
    nps = Column(Float, nullable=False)
    schedule = Column(Text, nullable=True)
    identification = Column(Text, nullable=True)   # STD, XS, XXS
    od_mm = Column(Float, nullable=False)
    wt_mm = Column(Float, nullable=False)
    mass_kg_m = Column(Float, nullable=True)
    od_in = Column(Float, nullable=True)
    wt_in = Column(Float, nullable=True)
    mass_lb_ft = Column(Float, nullable=True)

    # schedule이 NULL일 수 있으므로 물리적 유일성 기준(규격+DN+두께)으로 중복 방지
    __table_args__ = (UniqueConstraint("standard", "dn", "wt_mm"),)


class AllowableStress(Base):
    __tablename__ = "allowable_stress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(Text, nullable=False)
    material = Column(Text, nullable=False)
    temp_c = Column(Float, nullable=False)
    stress_mpa = Column(Float, nullable=False)

    __table_args__ = (UniqueConstraint("code", "material", "temp_c"),)
