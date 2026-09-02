from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    provider_type = Column(String, default="doctor")  # "doctor" or "lab"
    doctor_id = Column(Integer, ForeignKey("doctor_profiles.id"), nullable=True)
    lab_id = Column(Integer, ForeignKey("lab_profiles.id"), nullable=True)
    status = Column(String, default="pending")
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    notes = Column(String, nullable=True)
    patient_phone = Column(String, nullable=True)
    reject_reason = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    
class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String, nullable=False)  # medicine, follow_up, appointment
    message = Column(String, nullable=False)
    remind_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())