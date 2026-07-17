from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str = "HELLO AHMAD"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

settings = Settings()