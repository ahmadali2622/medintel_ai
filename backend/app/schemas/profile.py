from pydantic import BaseModel
from typing import Optional

class DoctorProfileCreate(BaseModel):
    name: str
    specialization: str
    phone: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class DoctorProfileOut(BaseModel):
    id: int
    user_id: int
    name: str
    specialization: str
    phone: Optional[str] = None
    license_doc_url: Optional[str]
    verified: bool
    lat: Optional[float]
    lng: Optional[float]

    class Config:
        from_attributes = True


class LabProfileCreate(BaseModel):
    lab_name: str
    phone: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class LabProfileOut(BaseModel):
    id: int
    user_id: int
    lab_name: str
    phone: Optional[str] = None
    license_doc_url: Optional[str]
    verified: bool
    lat: Optional[float]
    lng: Optional[float]

    class Config:
        from_attributes = True