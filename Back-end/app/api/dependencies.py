from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.utils.security import decode_token
from app.services.auth import AuthService
from app.models.user import User
from collections import defaultdict
from datetime import datetime, timedelta

security = HTTPBearer()

# Simple in-memory rate limiter (for production, use Redis)
_rate_limit_storage = defaultdict(list)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    
    token = credentials.credentials
    
    # Decode token
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz veya süresi dolmuş token"
        )
    
    # Check token type
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz token tipi"
        )
    
    # Get user
    user_id = int(payload.get("sub"))
    user = AuthService.get_user_by_id(db, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı bulunamadı"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız devre dışı bırakılmış"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız devre dışı bırakılmış"
        )
    return current_user


def get_current_user_from_token(token: str, db: Session) -> User:
    """Get current authenticated user from a raw Bearer token (synchronous helper).

    This is useful in contexts where FastAPI dependency injection is not available
    (e.g., Strawberry GraphQL resolvers).
    """
    # Decode token
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz veya süresi dolmuş token"
        )

    # Check token type
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz token tipi"
        )

    # Get user
    user_id = int(payload.get("sub"))
    user = AuthService.get_user_by_id(db, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı bulunamadı"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız devre dışı bırakılmış"
        )

    return user


def rate_limit_public(request: Request, max_requests: int = 5, window_minutes: int = 60):
    """
    Rate limiting for public endpoints.
    
    Limits requests per IP address.
    Default: 5 requests per 60 minutes (1 hour)
    
    Args:
        request: FastAPI request object
        max_requests: Maximum number of requests allowed
        window_minutes: Time window in minutes
    
    Raises:
        HTTPException: If rate limit is exceeded
    """
    # Get client IP
    client_ip = request.client.host
    
    # Get current time
    now = datetime.now()
    cutoff_time = now - timedelta(minutes=window_minutes)
    
    # Clean old entries
    _rate_limit_storage[client_ip] = [
        timestamp for timestamp in _rate_limit_storage[client_ip]
        if timestamp > cutoff_time
    ]
    
    # Check if limit exceeded
    if len(_rate_limit_storage[client_ip]) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Please try again in {window_minutes} minutes."
        )
    
    # Add current request
    _rate_limit_storage[client_ip].append(now)
