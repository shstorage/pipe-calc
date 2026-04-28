import csv
import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from database.db import get_db
from database.models import PipeSchedule
from schemas.pipe_table import PipeScheduleOut

router = APIRouter(prefix="/api/pipe-schedule", tags=["pipe-schedule"])


@router.get("", response_model=list[PipeScheduleOut])
def get_pipe_schedules(
    standard: str | None = Query(None),
    dn: int | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(PipeSchedule)
    if standard:
        q = q.filter(PipeSchedule.standard == standard)
    if dn is not None:
        q = q.filter(PipeSchedule.dn == dn)
    return q.order_by(PipeSchedule.dn, PipeSchedule.wt_mm).all()


@router.post("/upload")
def upload_pipe_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = file.file.read().decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(content))
    inserted = 0
    skipped = 0
    for row in reader:
        obj = PipeSchedule(
            standard=row["standard"].strip(),
            dn=int(row["dn"]),
            nps=float(row["nps"]),
            schedule=row["schedule"].strip(),
            od_mm=float(row["od_mm"]),
            wt_mm=float(row["wt_mm"]),
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
def delete_pipe_schedule(item_id: int, db: Session = Depends(get_db)):
    obj = db.query(PipeSchedule).filter(PipeSchedule.id == item_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(obj)
    db.commit()
    return {"deleted": item_id}
