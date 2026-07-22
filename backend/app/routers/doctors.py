from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.profile import DoctorProfile, LabProfile
from app.schemas.profile import DoctorProfileCreate, DoctorProfileOut, LabProfileCreate, LabProfileOut
from app.core.deps import get_current_user
from app.models.user import User

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
def nearby_doctors(db: Session = Depends(get_db)):
    return db.query(DoctorProfile).filter(DoctorProfile.verified == True).all()


@router.get("/labs/nearby", response_model=list[LabProfileOut])
def nearby_labs(db: Session = Depends(get_db)):
    return db.query(LabProfile).filter(LabProfile.verified == True).all()