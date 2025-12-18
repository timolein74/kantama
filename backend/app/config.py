from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Kantama"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./Kantama.db"
    
    # JWT
    SECRET_KEY: str = "your-super-secret-key-change-in-production-Kantama-2025"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "noreply@Kantama.fi"
    SMTP_FROM_NAME: str = "Kantama"
    
    # Admin email for notifications
    ADMIN_EMAIL: str = "myynti@Kantama.fi"
    
    # Frontend URL
    FRONTEND_URL: str = "http://localhost:5173"
    
    # File uploads
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

