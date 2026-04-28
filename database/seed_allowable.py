"""ASME B31.1 / B31.3 allowable stress seed data."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database.db import SessionLocal, engine
from database import models

models.Base.metadata.create_all(bind=engine)

# fmt: off
DATA = [
    # code,      material,       temp_c, stress_mpa
    # ── A106 Gr.B (Carbon Steel, Seamless) ──────────────────────────────
    ("B31.1", "A106 Gr.B",   20,  138.0),
    ("B31.1", "A106 Gr.B",   50,  138.0),
    ("B31.1", "A106 Gr.B",  100,  138.0),
    ("B31.1", "A106 Gr.B",  150,  131.0),
    ("B31.1", "A106 Gr.B",  200,  117.0),
    ("B31.1", "A106 Gr.B",  250,  110.0),
    ("B31.1", "A106 Gr.B",  300,  103.0),
    ("B31.1", "A106 Gr.B",  350,   96.0),
    ("B31.1", "A106 Gr.B",  400,   89.0),
    ("B31.1", "A106 Gr.B",  450,   62.0),

    ("B31.3", "A106 Gr.B",   20,  138.0),
    ("B31.3", "A106 Gr.B",   50,  138.0),
    ("B31.3", "A106 Gr.B",  100,  138.0),
    ("B31.3", "A106 Gr.B",  150,  131.0),
    ("B31.3", "A106 Gr.B",  200,  117.0),
    ("B31.3", "A106 Gr.B",  250,  110.0),
    ("B31.3", "A106 Gr.B",  300,  103.0),
    ("B31.3", "A106 Gr.B",  350,   96.0),
    ("B31.3", "A106 Gr.B",  400,   89.0),
    ("B31.3", "A106 Gr.B",  450,   62.0),

    # ── A312 TP304 (Austenitic Stainless Steel) ──────────────────────────
    ("B31.1", "A312 TP304",  20,  137.0),
    ("B31.1", "A312 TP304",  50,  130.0),
    ("B31.1", "A312 TP304", 100,  120.0),
    ("B31.1", "A312 TP304", 150,  114.0),
    ("B31.1", "A312 TP304", 200,  108.0),
    ("B31.1", "A312 TP304", 250,  103.0),
    ("B31.1", "A312 TP304", 300,  100.0),
    ("B31.1", "A312 TP304", 350,   97.0),
    ("B31.1", "A312 TP304", 400,   94.0),
    ("B31.1", "A312 TP304", 450,   92.0),

    ("B31.3", "A312 TP304",  20,  137.0),
    ("B31.3", "A312 TP304",  50,  130.0),
    ("B31.3", "A312 TP304", 100,  120.0),
    ("B31.3", "A312 TP304", 150,  114.0),
    ("B31.3", "A312 TP304", 200,  108.0),
    ("B31.3", "A312 TP304", 250,  103.0),
    ("B31.3", "A312 TP304", 300,  100.0),
    ("B31.3", "A312 TP304", 350,   97.0),
    ("B31.3", "A312 TP304", 400,   94.0),
    ("B31.3", "A312 TP304", 450,   92.0),
]
# fmt: on


def seed():
    db = SessionLocal()
    inserted = 0
    skipped = 0
    for row in DATA:
        obj = models.AllowableStress(
            code=row[0], material=row[1], temp_c=row[2], stress_mpa=row[3],
        )
        db.add(obj)
        try:
            db.commit()
            inserted += 1
        except Exception:
            db.rollback()
            skipped += 1
    db.close()
    print(f"allowable_stress: inserted={inserted}, skipped={skipped}")


if __name__ == "__main__":
    seed()
