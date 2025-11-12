from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import (
    UserRegister,
    UserLogin,
    TokenResponse,
    MessageResponse,
    ForgotPassword,
    VerifyResetToken,
    ResetPassword,
    ChangePassword,
    UserResponse
)
from app.services.auth import AuthService
from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Yeni kullanıcı kaydı
    
    - **email**: Geçerli email adresi
    - **full_name**: Ad Soyad (minimum 2 karakter)
    - **password**: Şifre (minimum 6 karakter)
    """
    result = await AuthService.register(db, user_data)
    return result


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Kullanıcı girişi
    
    - **email**: Kayıtlı email adresi
    - **password**: Şifre
    """
    result = AuthService.login(db, credentials)
    return result


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(data: ForgotPassword, db: Session = Depends(get_db)):
    """
    Şifre sıfırlama kodu gönder
    
    - **email**: Kayıtlı email adresi
    
    6 haneli kod email'e gönderilir (15 dakika geçerli)
    """
    result = await AuthService.forgot_password(db, data.email)
    return result


@router.post("/verify-reset-token", response_model=MessageResponse)
async def verify_reset_token(data: VerifyResetToken, db: Session = Depends(get_db)):
    """
    Şifre sıfırlama kodunu doğrula
    
    - **email**: Kayıtlı email adresi
    - **token**: 6 haneli kod
    """
    result = AuthService.verify_reset_token(db, data.email, data.token)
    return result


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(data: ResetPassword, db: Session = Depends(get_db)):
    """
    Şifre sıfırla
    
    - **email**: Kayıtlı email adresi
    - **token**: 6 haneli doğrulanmış kod
    - **new_password**: Yeni şifre (minimum 6 karakter)
    """
    result = AuthService.reset_password(db, data.email, data.token, data.new_password)
    return result


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Şifre değiştir (giriş yapmış kullanıcı için)
    
    - **old_password**: Mevcut şifre
    - **new_password**: Yeni şifre (minimum 6 karakter)
    
    **Requires authentication**
    """
    result = AuthService.change_password(db, current_user.id, data.old_password, data.new_password)
    return result


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Giriş yapmış kullanıcı bilgilerini getir
    
    **Requires authentication**
    """
    return current_user
