from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.appointment import Appointment, Reminder
from app.schemas.appointment import AppointmentCreate, AppointmentOut, ReminderCreate, ReminderOut
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(tags=["appointments"])


@router.post("/appointments/book", response_model=AppointmentOut)
def book_appointment(data: AppointmentCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if data.provider_type not in ("doctor", "lab"):
        raise HTTPException(status_code=400, detail="provider_type must be 'doctor' or 'lab'")
    if data.provider_type == "doctor" and not data.doctor_id:
        raise HTTPException(status_code=400, detail="doctor_id is required")
    if data.provider_type == "lab" and not data.lab_id:
        raise HTTPException(status_code=400, detail="lab_id is required")

    # Double-booking prevention: same provider, same time, not cancelled/rejected
    conflict_query = db.query(Appointment).filter(
        Appointment.scheduled_at == data.scheduled_at,
        Appointment.status.in_(["pending", "confirmed"]),
    )
    if data.provider_type == "doctor":
        conflict_query = conflict_query.filter(Appointment.doctor_id == data.doctor_id)
    else:
        conflict_query = conflict_query.filter(Appointment.lab_id == data.lab_id)

    if conflict_query.first():
        raise HTTPException(status_code=409, detail="This time slot is already booked. Please choose another time.")

    appointment = Appointment(patient_id=user.id, **data.dict())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.get("/appointments/my", response_model=list[AppointmentOut])
def my_appointments(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Appointment).filter(Appointment.patient_id == user.id).order_by(Appointment.scheduled_at).all()


@router.post("/appointments/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel_appointment(appointment_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id, Appointment.patient_id == user.id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt.status = "cancelled"
    db.commit()
    db.refresh(appt)
    return appt


@router.delete("/appointments/{appointment_id}")
def delete_appointment(appointment_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id, Appointment.patient_id == user.id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    db.delete(appt)
    db.commit()
    return {"message": "Appointment deleted"}


@router.post("/reminders/create", response_model=ReminderOut)
def create_reminder(data: ReminderCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    reminder = Reminder(patient_id=user.id, **data.dict())
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


@router.get("/reminders/upcoming", response_model=list[ReminderOut])
def upcoming_reminders(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Reminder).filter(Reminder.patient_id == user.id).order_by(Reminder.remind_at).all()


@router.delete("/reminders/{reminder_id}")
def delete_reminder(reminder_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rem = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.patient_id == user.id).first()
    if not rem:
        raise HTTPException(status_code=404, detail="Reminder not found")
    db.delete(rem)
    db.commit()
    return {"message": "Reminder deleted"}