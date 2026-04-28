from sqlalchemy import Column, Integer, Float, Text, UniqueConstraint
from database.db import Base


class PipeSchedule(Base):
    __tablename__ = "pipe_schedule"

    id = Column(Integer, primary_key=True, autoincrement=True)
    standard = Column(Text, nullable=False)
    dn = Column(Integer, nullable=False)
    nps = Column(Float, nullable=False)
    schedule = Column(Text, nullable=False)
    od_mm = Column(Float, nullable=False)
    wt_mm = Column(Float, nullable=False)

    __table_args__ = (UniqueConstraint("standard", "dn", "schedule"),)


class AllowableStress(Base):
    __tablename__ = "allowable_stress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(Text, nullable=False)
    material = Column(Text, nullable=False)
    temp_c = Column(Float, nullable=False)
    stress_mpa = Column(Float, nullable=False)

    __table_args__ = (UniqueConstraint("code", "material", "temp_c"),)
