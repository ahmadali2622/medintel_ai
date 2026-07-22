from fastapi import FastAPI
from app.db.session import engine, Base
from app.models.user import User
from app.routers import auth

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "MedIntel AI backend running"}

from app.routers import reports
app.include_router(reports.router)

from app.models.chat import ChatSession, ChatMessage
from app.routers import chatbot

app.include_router(chatbot.router)

from app.models.profile import DoctorProfile, LabProfile
from app.routers import doctors, admin

app.include_router(doctors.router)
app.include_router(admin.router)