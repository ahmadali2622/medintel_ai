from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AppointmentCreate(BaseModel):
    doctor_id: int
    scheduled_at: datetime
    notes: Optional[str] = None

class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    status: str
    scheduled_at: datetime
    notes: Optional[str]

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