from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.profile import DoctorProfile, LabProfile
from app.core.deps import require_role

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/pending-verifications")
def pending_verifications(
    db: Session = Depends(get_db),
    admin=Depends(require_role("admin"))
):
    doctors = db.query(DoctorProfile).filter(DoctorProfile.verified == False).all()
    labs = db.query(LabProfile).filter(LabProfile.verified == False).all()

    return {
        "doctors": [
            {
                "id": d.id,
                "name": d.name,
                "specialization": d.specialization
            }
            for d in doctors
        ],
        "labs": [
            {
                "id": l.id,
                "lab_name": l.lab_name
            }
            for l in labs
        ]
    }