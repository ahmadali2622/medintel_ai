import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import engine, Base, SessionLocal
from app.core.security import hash_password

# --- Models (must be imported before create_all) ---
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.models.profile import DoctorProfile, LabProfile
from app.models.appointment import Appointment, Reminder
from app.models.report import Report    
from app.models.review import Review

# --- Routers ---
from app.routers import auth
from app.routers import reports
from app.routers import chatbot
from app.routers import doctors
from app.routers import admin
from app.routers import appointments

# --- Create all tables ---
Base.metadata.create_all(bind=engine)

# --- Seed admin account ---
def seed_admin():
    db = SessionLocal()
    try:
        admin_email = os.getenv("ADMIN_EMAIL")
        admin_password = os.getenv("ADMIN_PASSWORD")
        if admin_email and admin_password:
            existing = db.query(User).filter(User.email == admin_email).first()
            if not existing:
                admin_user = User(
                    email=admin_email,
                    hashed_password=hash_password(admin_password),
                    role="admin",
                )
                db.add(admin_user)
                db.commit()
    finally:
        db.close()

seed_admin()

# --- App instance ---
app = FastAPI()

# --- Add CORS middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://medintel-ai-black.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Register routers ---
app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(chatbot.router)
app.include_router(doctors.router)
app.include_router(admin.router)
app.include_router(appointments.router)


@app.get("/")
def read_root():
    return {"message": "MedIntel AI backend running"}