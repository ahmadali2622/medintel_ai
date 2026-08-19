from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.profile import DoctorProfile, LabProfile
from app.schemas.user import UserCreate, UserLogin, UserOut, Token
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user.email,
        hashed_password=hash_password(user.password),
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # ✅ Auto-create profile based on role
    if user.role == "doctor":
        profile = DoctorProfile(
            user_id=new_user.id,
            name=user.name or "",
            specialization=user.specialization or "",
            verified=False
        )
        db.add(profile)
        db.commit()

    elif user.role == "lab":
        profile = LabProfile(
            user_id=new_user.id,
            lab_name=user.lab_name or "",
            verified=False
        )
        db.add(profile)
        db.commit()

    return new_user