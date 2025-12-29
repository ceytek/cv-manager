from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # File Uploads
    UPLOAD_DIR: Path = Path(__file__).parent.parent.parent / "uploads"
    CV_UPLOAD_DIR: Path = UPLOAD_DIR / "cvs"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5 MB in bytes
    ALLOWED_EXTENSIONS: set = {".pdf", ".docx"}
    
    # AI Service
    AI_SERVICE_URL: str = "http://127.0.0.1:8001"
    
    # Email
    MAIL_USERNAME: Optional[str] = None
    MAIL_PASSWORD: Optional[str] = None
    MAIL_FROM: str
    MAIL_PORT: int = 587
    MAIL_SERVER: str
    MAIL_FROM_NAME: str
    # Optional dual sender overrides
    MAIL_SENDER_APPLICANT: Optional[str] = None
    MAIL_SENDER_APPLICANT_NAME: Optional[str] = None
    MAIL_SENDER_APPLICANT_USER: Optional[str] = None
    MAIL_SENDER_APPLICANT_PASS: Optional[str] = None
    MAIL_SENDER_HR: Optional[str] = None
    MAIL_SENDER_HR_NAME: Optional[str] = None
    MAIL_SENDER_HR_USER: Optional[str] = None
    MAIL_SENDER_HR_PASS: Optional[str] = None
    HR_EMAIL: Optional[str] = None
    FRONTEND_URL: Optional[str] = None
    EMAIL_MAX_PER_SEC: int = 2
    EMAIL_RETRY_ATTEMPTS: int = 3
    EMAIL_RETRY_BASE_DELAY_MS: int = 400
    EMAIL_DISABLE_RETRY_ON_550: bool = False
    EMAIL_INTER_SEND_DELAY_SECONDS: int = 5
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
