from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.db.session import Base

class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    name = Column(String, nullable=False)
    specialization = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    license_doc_url = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, verified, rejected, cancelled
    reject_reason = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)


class LabProfile(Base):
    __tablename__ = "lab_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    lab_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    license_doc_url = Column(String, nullable=True)
    status = Column(String, default="pending")
    reject_reason = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)