from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str = "HELLO AHMAD"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-8b-instant"

settings = Settings()