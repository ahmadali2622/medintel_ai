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