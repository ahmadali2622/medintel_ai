from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AppointmentCreate(BaseModel):
    provider_type: str  # "doctor" or "lab"
    doctor_id: Optional[int] = None
    lab_id: Optional[int] = None
    scheduled_at: datetime
    notes: Optional[str] = None
    patient_phone: Optional[str] = None

class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    provider_type: str
    doctor_id: Optional[int]
    lab_id: Optional[int]
    status: str
    scheduled_at: datetime
    notes: Optional[str]
    patient_phone: Optional[str]
    reject_reason: Optional[str]

    class Config:
        from_attributes = True


class ReminderCreate(BaseModel):
    type: str
    message: str
    remind_at: datetime

class ReminderOut(BaseModel):
    id: int
    type: str
    message: str
    remind_at: datetime

    class Config:
        from_attributes = True