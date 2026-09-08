from pydantic import BaseModel
from typing import Optional

class ReviewCreate(BaseModel):
    doctor_id: int
    rating: int  # 1-5
    comment: Optional[str] = None

class ReviewOut(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    rating: int
    comment: Optional[str]
    created_at: Optional[str] = None

    class Config:
        from_attributes = True