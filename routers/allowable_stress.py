import csv
import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from database.db import get_db
from database.models import AllowableStress
from schemas.allowable_stress import AllowableStressOut

router = APIRouter(prefix="/api/allowable-stress", tags=["allowable-stress"])


@router.get("", response_model=list[AllowableStressOut])
def get_allowable_stresses(
    code: str | None = Query(None),
    material: str | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(AllowableStress)
    if code:
        q = q.filter(AllowableStress.code == code)
    if material:
        q = q.filter(AllowableStress.material == material)
    return q.order_by(AllowableStress.id).all()


@router.post("/upload")
def upload_stress_csv(
    file: UploadFile = File(...),
    mode: str = Query("add", pattern="^(add|replace)$"),
    db: Session = Depends(get_db),
):
    if mode == "replace":
        db.query(AllowableStress).delete()
        db.commit()

    content = file.file.read().decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(content))
    inserted = skipped = 0
    for row in reader:
        obj = AllowableStress(
            code=row["code"].strip(),
            material=row["material"].strip(),
            temp_c=float(row["temp_c"]),
            stress_mpa=float(row["stress_mpa"]),
        )
        db.add(obj)
        try:
            db.commit()
            inserted += 1
        except IntegrityError:
            db.rollback()
            skipped += 1
    return {"inserted": inserted, "skipped": skipped}


@router.delete("/{item_id}")
def delete_allowable_stress(item_id: int, db: Session = Depends(get_db)):
    obj = db.query(AllowableStress).filter(AllowableStress.id == item_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(obj)
    db.commit()
    return {"deleted": item_id}
