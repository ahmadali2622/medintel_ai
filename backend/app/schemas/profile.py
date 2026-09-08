from pydantic import BaseModel
from typing import Optional

class DoctorProfileOut(BaseModel):
    id: int
    user_id: int
    name: str
    specialization: str
    phone: Optional[str] = None
    photo_url: Optional[str] = None
    license_doc_url: Optional[str] = None
    status: str
    reject_reason: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    average_rating: Optional[float] = None
    review_count: Optional[int] = None

    class Config:
        from_attributes = True


class LabProfileOut(BaseModel):
    id: int
    user_id: int
    lab_name: str
    phone: Optional[str] = None
    license_doc_url: Optional[str] = None
    status: str
    reject_reason: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

    class Config:
        from_attributes = True