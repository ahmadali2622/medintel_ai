from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine, Base

# --- Models (must be imported before create_all) ---
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.models.profile import DoctorProfile, LabProfile

# --- Routers ---
from app.routers import auth
from app.routers import reports
from app.routers import chatbot
from app.routers import doctors
from app.routers import admin

# --- Create all tables ---
Base.metadata.create_all(bind=engine)

# --- App instance ---
app = FastAPI()

# --- Add CORS middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://192.168.1.248:5173/"],  # Allow origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# --- Register routers ---
app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(chatbot.router)
app.include_router(doctors.router)
app.include_router(admin.router)


@app.get("/")
def read_root():
    return {"message": "MedIntel AI backend running"}