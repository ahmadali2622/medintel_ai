from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.profile import DoctorProfile, LabProfile
from app.core.deps import require_role

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/pending-verifications")
def pending_verifications(db: Session = Depends(get_db), admin=Depends(require_role("admin"))):
    doctors = db.query(DoctorProfile).filter(DoctorProfile.verified == False).all()
    labs = db.query(LabProfile).filter(LabProfile.verified == False).all()
    return {"doctors": doctors, "labs": labs}


@router.post("/verify-doctor/{doctor_id}")
def verify_doctor(doctor_id: int, db: Session = Depends(get_db), admin=Depends(require_role("admin"))):
    doctor = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    doctor.verified = True
    db.commit()
    return {"message": "Doctor verified", "doctor_id": doctor_id}


@router.post("/verify-lab/{lab_id}")
def verify_lab(lab_id: int, db: Session = Depends(get_db), admin=Depends(require_role("admin"))):
    lab = db.query(LabProfile).filter(LabProfile.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    lab.verified = True
    db.commit()
    return {"message": "Lab verified", "lab_id": lab_id}