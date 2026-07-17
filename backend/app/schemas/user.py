from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "user"  # Default role is "user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str
    
    class Config:
        from_attributes = True  # This allows Pydantic to read data from SQLAlchemy models

class Token(BaseModel):
    access_token: str
    token_type: str
