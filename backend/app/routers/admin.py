from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.profile import DoctorProfile, LabProfile
from app.core.deps import require_role
from fastapi.responses import FileResponse
import os

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/pending-verifications")
def pending_verifications(db: Session = Depends(get_db), admin=Depends(require_role("admin"))):
    doctors = db.query(DoctorProfile).filter(DoctorProfile.status == "pending").all()
    labs = db.query(LabProfile).filter(LabProfile.status == "pending").all()
    return {
        "doctors": [
            {"id": d.id, "name": d.name, "specialization": d.specialization, "phone": d.phone, "has_document": bool(d.license_doc_url)}
            for d in doctors
        ],
        "labs": [
            {"id": l.id, "lab_name": l.lab_name, "phone": l.phone, "has_document": bool(l.license_doc_url)}
            for l in labs
        ]
    }


@router.post("/verify-doctor/{doctor_id}")
def verify_doctor(doctor_id: int, db: Session = Depends(get_db), admin=Depends(require_role("admin"))):
    doctor = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    doctor.status = "verified"
    doctor.reject_reason = None
    db.commit()
    return {"message": "Doctor verified", "doctor_id": doctor_id}


@router.post("/reject-doctor/{doctor_id}")
def reject_doctor(doctor_id: int, reason: str, db: Session = Depends(get_db), admin=Depends(require_role("admin"))):
    doctor = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    doctor.status = "rejected"
    doctor.reject_reason = reason
    db.commit()
    return {"message": "Doctor rejected", "doctor_id": doctor_id}


@router.post("/cancel-doctor/{doctor_id}")
def cancel_doctor(doctor_id: int, db: Session = Depends(get_db), admin=Depends(require_role("admin"))):
    doctor = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    doctor.status = "cancelled"
    db.commit()
    return {"message": "Doctor request cancelled", "doctor_id": doctor_id}


@router.post("/verify-lab/{lab_id}")
def verify_lab(lab_id: int, db: Session = Depends(get_db), admin=Depends(require_role("admin"))):
    lab = db.query(LabProfile).filter(LabProfile.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    lab.status = "verified"
    lab.reject_reason = None
    db.commit()
    return {"message": "Lab verified", "lab_id": lab_id}


@router.post("/reject-lab/{lab_id}")
def reject_lab(lab_id: int, reason: str, db: Session = Depends(get_db), admin=Depends(require_role("admin"))):
    lab = db.query(LabProfile).filter(LabProfile.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    lab.status = "rejected"
    lab.reject_reason = reason
    db.commit()
    return {"message": "Lab rejected", "lab_id": lab_id}


@router.post("/cancel-lab/{lab_id}")
def cancel_lab(lab_id: int, db: Session = Depends(get_db), admin=Depends(require_role("admin"))):
    lab = db.query(LabProfile).filter(LabProfile.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    lab.status = "cancelled"
    db.commit()
    return {"message": "Lab request cancelled", "lab_id": lab_id}


@router.get("/view-document/{profile_type}/{profile_id}")
def view_document(profile_type: str, profile_id: int, db: Session = Depends(get_db), admin=Depends(require_role("admin"))):
    if profile_type == "doctor":
        profile = db.query(DoctorProfile).filter(DoctorProfile.id == profile_id).first()
    elif profile_type == "lab":
        profile = db.query(LabProfile).filter(LabProfile.id == profile_id).first()
    else:
        raise HTTPException(status_code=400, detail="Invalid profile type")
    if not profile or not profile.license_doc_url:
        raise HTTPException(status_code=404, detail="Document not found")
    if not os.path.exists(profile.license_doc_url):
        raise HTTPException(status_code=404, detail="File missing on server")
    return FileResponse(profile.license_doc_url)