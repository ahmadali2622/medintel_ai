from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi import UploadFile, File
import shutil
import os
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.profile import DoctorProfile, LabProfile
from app.models.appointment import Appointment
from app.models.user import User
from app.schemas.profile import DoctorProfileOut, LabProfileOut
from app.core.deps import get_current_user
from app.services.maps_service import haversine_distance
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewOut
from fastapi.responses import FileResponse
from sqlalchemy import func as sqlfunc

router = APIRouter(tags=["doctors-labs"])


from fastapi import Form


@router.post("/doctors/register", response_model=DoctorProfileOut)
async def register_doctor(
    name: str = Form(...),
    specialization: str = Form(...),
    phone: str = Form(None),
    lat: float = Form(31.5204),
    lng: float = Form(74.3587),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    existing = db.query(DoctorProfile).filter(DoctorProfile.user_id == user.id).first()
    if existing and existing.status != "rejected" and existing.status != "cancelled":
        return existing

    filename = f"doctor_{user.id}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    if existing:
        existing.name = name
        existing.specialization = specialization
        existing.phone = phone
        existing.lat = lat
        existing.lng = lng
        existing.license_doc_url = filepath
        existing.status = "pending"
        existing.reject_reason = None
        db.commit()
        db.refresh(existing)
        return existing

    profile = DoctorProfile(
        user_id=user.id, name=name, specialization=specialization,
        phone=phone, lat=lat, lng=lng, license_doc_url=filepath, status="pending"
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/labs/register", response_model=LabProfileOut)
async def register_lab(
    lab_name: str = Form(...),
    phone: str = Form(None),
    lat: float = Form(31.5204),
    lng: float = Form(74.3587),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    existing = db.query(LabProfile).filter(LabProfile.user_id == user.id).first()
    if existing and existing.status != "rejected" and existing.status != "cancelled":
        return existing

    filename = f"lab_{user.id}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    if existing:
        existing.lab_name = lab_name
        existing.phone = phone
        existing.lat = lat
        existing.lng = lng
        existing.license_doc_url = filepath
        existing.status = "pending"
        existing.reject_reason = None
        db.commit()
        db.refresh(existing)
        return existing

    profile = LabProfile(
        user_id=user.id, lab_name=lab_name, phone=phone,
        lat=lat, lng=lng, license_doc_url=filepath, status="pending"
    )
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

    def with_rating(doc):
        avg = db.query(sqlfunc.avg(Review.rating)).filter(Review.doctor_id == doc.id).scalar()
        count = db.query(Review).filter(Review.doctor_id == doc.id).count()
        doc.average_rating = round(avg, 1) if avg else None
        doc.review_count = count
        return doc

    if lat is None or lng is None:
        return [with_rating(d) for d in doctors]

    results = []
    for doc in doctors:
        if doc.lat is not None and doc.lng is not None:
            dist = haversine_distance(lat, lng, doc.lat, doc.lng)
            if dist <= radius_km:
                results.append((dist, with_rating(doc)))
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

@router.post("/doctors/appointments/{appointment_id}/complete")
def complete_appointment(appointment_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    appt = db.query(Appointment).filter(Appointment.id == appointment_id, Appointment.doctor_id == profile.id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt.status = "completed"
    db.commit()
    return {"message": "Appointment marked as completed"}


@router.get("/labs/my-profile", response_model=LabProfileOut)
def my_lab_profile(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    profile = db.query(LabProfile).filter(LabProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Lab profile not found. Please register your profile first.")
    return profile

UPLOAD_DIR = "uploads/licenses"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/doctors/upload-license")
async def upload_doctor_license(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    filename = f"doctor_{profile.id}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    profile.license_doc_url = filepath
    db.commit()
    return {"message": "License uploaded", "file_path": filepath}


@router.post("/labs/upload-license")
async def upload_lab_license(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    profile = db.query(LabProfile).filter(LabProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Lab profile not found")

    filename = f"lab_{profile.id}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    profile.license_doc_url = filepath
    db.commit()
    return {"message": "License uploaded", "file_path": filepath}

PHOTO_DIR = "uploads/photos"
os.makedirs(PHOTO_DIR, exist_ok=True)


@router.post("/doctors/upload-photo")
async def upload_doctor_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    filename = f"doctor_{profile.id}_{file.filename}"
    filepath = os.path.join(PHOTO_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    profile.photo_url = filepath
    db.commit()
    return {"message": "Photo uploaded", "file_path": filepath}


@router.get("/doctors/{doctor_id}/photo")
def get_doctor_photo(doctor_id: int, db: Session = Depends(get_db)):
    profile = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not profile or not profile.photo_url or not os.path.exists(profile.photo_url):
        raise HTTPException(status_code=404, detail="Photo not found")
    return FileResponse(profile.photo_url)


@router.post("/doctors/{doctor_id}/reviews", response_model=ReviewOut)
def create_review(doctor_id: int, data: ReviewCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can leave reviews")
    if data.rating < 1 or data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    review = Review(patient_id=user.id, doctor_id=doctor_id, rating=data.rating, comment=data.comment)
    db.add(review)
    db.commit()
    db.refresh(review)
    return {
        "id": review.id,
        "patient_id": review.patient_id,
        "doctor_id": review.doctor_id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at.isoformat() if review.created_at else None,
    }


@router.get("/doctors/{doctor_id}/reviews")
def get_doctor_reviews(doctor_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.doctor_id == doctor_id).order_by(Review.created_at.desc()).all()
    avg = db.query(sqlfunc.avg(Review.rating)).filter(Review.doctor_id == doctor_id).scalar()
    return {
        "average_rating": round(avg, 1) if avg else None,
        "review_count": len(reviews),
        "reviews": [
            {
                "id": r.id,
                "rating": r.rating,
                "comment": r.comment,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in reviews
        ]
    }