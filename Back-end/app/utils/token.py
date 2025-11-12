import random
import string
from datetime import datetime, timedelta
from app.core.config import settings


def generate_reset_token() -> str:
    """Generate 6-digit reset token"""
    return ''.join(random.choices(string.digits, k=6))


def get_reset_token_expiry() -> datetime:
    """Get reset token expiry time"""
    return datetime.utcnow() + timedelta(minutes=settings.RESET_PASSWORD_TOKEN_EXPIRE_MINUTES)


def is_token_expired(expires_at: datetime) -> bool:
    """Check if token is expired"""
    return datetime.utcnow() > expires_at
