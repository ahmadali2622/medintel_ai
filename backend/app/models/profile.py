from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey
from app.db.session import Base

class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    name = Column(String, nullable=False)
    specialization = Column(String, nullable=False)
    license_doc_url = Column(String, nullable=True)
    verified = Column(Boolean, default=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)


class LabProfile(Base):
    __tablename__ = "lab_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    lab_name = Column(String, nullable=False)
    license_doc_url = Column(String, nullable=True)
    verified = Column(Boolean, default=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)