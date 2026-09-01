from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.profile import DoctorProfile, LabProfile
from app.models.appointment import Appointment
from app.models.user import User
from app.schemas.profile import DoctorProfileCreate, DoctorProfileOut, LabProfileCreate, LabProfileOut
from app.core.deps import get_current_user
from app.services.maps_service import haversine_distance

router = APIRouter(tags=["doctors-labs"])


@router.post("/doctors/register", response_model=DoctorProfileOut)
def register_doctor(data: DoctorProfileCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = db.query(DoctorProfile).filter(DoctorProfile.user_id == user.id).first()
    if existing:
        return existing
    profile = DoctorProfile(user_id=user.id, **data.dict())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/labs/register", response_model=LabProfileOut)
def register_lab(data: LabProfileCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = db.query(LabProfile).filter(LabProfile.user_id == user.id).first()
    if existing:
        return existing
    profile = LabProfile(user_id=user.id, **data.dict())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/doctors/nearby", response_model=list[DoctorProfileOut])
def nearby_doctors(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: float = 20,
    db: Session = Depends(get_db)
):
    doctors = db.query(DoctorProfile).filter(DoctorProfile.verified == True).all()
    if lat is None or lng is None:
        return doctors
    results = []
    for doc in doctors:
        if doc.lat is not None and doc.lng is not None:
            dist = haversine_distance(lat, lng, doc.lat, doc.lng)
            if dist <= radius_km:
                results.append((dist, doc))
    results.sort(key=lambda x: x[0])
    return [doc for _, doc in results]


@router.get("/labs/nearby", response_model=list[LabProfileOut])
def nearby_labs(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: float = 20,
    db: Session = Depends(get_db)
):
    labs = db.query(LabProfile).filter(LabProfile.verified == True).all()
    if lat is None or lng is None:
        return labs
    results = []
    for lab in labs:
        if lab.lat is not None and lab.lng is not None:
            dist = haversine_distance(lat, lng, lab.lat, lab.lng)
            if dist <= radius_km:
                results.append((dist, lab))
    results.sort(key=lambda x: x[0])
    return [lab for _, lab in results]


@router.get("/doctors/my-profile", response_model=DoctorProfileOut)
def my_doctor_profile(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found. Please register your profile first.")
    return profile


@router.get("/doctors/my-appointments")
def my_doctor_appointments(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == user.id).first()
    if not profile:
        return []
    appointments = db.query(Appointment).filter(Appointment.doctor_id == profile.id).order_by(Appointment.scheduled_at).all()
    result = []
    for appt in appointments:
        patient = db.query(User).filter(User.id == appt.patient_id).first()
        result.append({
            "id": appt.id,
            "patient_email": patient.email if patient else "Unknown",
            "patient_phone": appt.patient_phone,
            "status": appt.status,
            "scheduled_at": appt.scheduled_at,
            "notes": appt.notes,
            "reject_reason": appt.reject_reason,
        })
    return result

@router.post("/doctors/appointments/{appointment_id}/confirm")
def confirm_appointment(appointment_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    appt = db.query(Appointment).filter(Appointment.id == appointment_id, Appointment.doctor_id == profile.id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt.status = "confirmed"
    db.commit()
    return {"message": "Appointment confirmed", "appointment_id": appointment_id}

@router.post("/doctors/appointments/{appointment_id}/reject")
def reject_appointment(
    appointment_id: int,
    reason: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    appt = db.query(Appointment).filter(Appointment.id == appointment_id, Appointment.doctor_id == profile.id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt.status = "rejected"
    appt.reject_reason = reason
    db.commit()
    return {"message": "Appointment rejected", "appointment_id": appointment_id}


@router.get("/labs/my-profile", response_model=LabProfileOut)
def my_lab_profile(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    profile = db.query(LabProfile).filter(LabProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Lab profile not found. Please register your profile first.")
    return profile