from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # File Uploads
    UPLOAD_DIR: Path = Path(__file__).parent.parent.parent / "uploads"
    CV_UPLOAD_DIR: Path = UPLOAD_DIR / "cvs"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5 MB in bytes
    ALLOWED_EXTENSIONS: set = {".pdf", ".docx"}
    
    # AI Service
    AI_SERVICE_URL: str = "http://localhost:8001"
    
    # Email
    MAIL_USERNAME: Optional[str] = None
    MAIL_PASSWORD: Optional[str] = None
    MAIL_FROM: str
    MAIL_PORT: int = 587
    MAIL_SERVER: str
    MAIL_FROM_NAME: str
    # Mailtrap API
    MAILTRAP_API_TOKEN: Optional[str] = None
    
    # Reset Password
    RESET_PASSWORD_TOKEN_EXPIRE_MINUTES: int = 15

    # Optional initial admin seed
    ADMIN_EMAIL: Optional[str] = None
    ADMIN_PASSWORD: Optional[str] = None
    ADMIN_FULL_NAME: Optional[str] = "Admin"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
