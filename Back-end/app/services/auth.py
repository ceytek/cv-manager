from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.models.role import Role
from app.schemas.user import UserRegister, UserLogin
from app.utils.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.utils.token import generate_reset_token, get_reset_token_expiry, is_token_expired
from app.services.email import send_reset_password_email, send_welcome_email
from typing import Optional


class AuthService:
    """Authentication service"""
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    async def register(db: Session, user_data: UserRegister) -> dict:
        """Register a new user"""
        # Check if user already exists
        existing_user = AuthService.get_user_by_email(db, user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bu email adresi zaten kayıtlı"
            )
        # Create new user (default role: user)
        role_user = db.query(Role).filter(Role.name == 'user').first()
        new_user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            password_hash=hash_password(user_data.password),
            role_id=role_user.id if role_user else None
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        # Send welcome email
        await send_welcome_email(new_user.email, new_user.full_name)
        # Generate tokens
        access_token = create_access_token(data={"sub": str(new_user.id), "email": new_user.email, "role": "user"})
        refresh_token = create_refresh_token(data={"sub": str(new_user.id)})
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": new_user
        }
    
    @staticmethod
    def login(db: Session, credentials: UserLogin, company_code: str = None) -> dict:
        """Login user with company_code support"""
        
        # If company_code provided, validate it
        company_id = None
        if company_code:
            from app.services.company_service import CompanyService
            import asyncio
            
            # For sync context, we need to handle async call
            # In production, consider making this fully async
            try:
                # Simple sync check - in production use proper async handling
                from sqlalchemy import text
                result = db.execute(text("SELECT id FROM companies WHERE company_code = :code AND is_active = true"), 
                                  {"code": company_code})
                row = result.first()
                if not row:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Geçersiz şirket kodu"
                    )
                company_id = str(row[0])
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Şirket kodu doğrulanamadı"
                )
        
        # Get user
        user = AuthService.get_user_by_email(db, credentials.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email veya şifre hatalı"
            )
        
        # If company_code provided, check user belongs to company
        if company_id and hasattr(user, 'company_id'):
            if str(user.company_id) != company_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Bu şirkete erişim yetkiniz yok"
                )
        
        # Verify password
        if not verify_password(credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email veya şifre hatalı"
            )
        
        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Hesabınız devre dışı bırakılmış"
            )
        
        # Generate tokens with company_id
        # Determine role name
        role_name = None
        try:
            if user.role_id:
                role_obj = db.query(Role).filter(Role.id == user.role_id).first()
                role_name = role_obj.name if role_obj else None
        except Exception:
            role_name = None

        # Get user's company_id if not from company_code
        if not company_id and hasattr(user, 'company_id'):
            company_id = str(user.company_id) if user.company_id else None

        token_data = {
            "sub": str(user.id), 
            "email": user.email, 
            "role": role_name or "user"
        }
        
        # Add company_id to token if available
        if company_id:
            token_data["company_id"] = company_id

        access_token = create_access_token(data=token_data)
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user
        }
    
    @staticmethod
    async def forgot_password(db: Session, email: str) -> dict:
        """Send password reset token"""
        
        # Get user
        user = AuthService.get_user_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="EMAIL_NOT_FOUND"
            )
        
        # Generate reset token
        reset_token = generate_reset_token()
        reset_token_expires_at = get_reset_token_expiry()
        
        # Save token to database
        user.reset_token = reset_token
        user.reset_token_expires_at = reset_token_expires_at
        db.commit()
        
        # Send email
        await send_reset_password_email(user.email, reset_token, user.full_name)
        
        return {"message": "Şifre sıfırlama kodu email adresinize gönderildi"}
    
    @staticmethod
    def verify_reset_token(db: Session, email: str, token: str) -> dict:
        """Verify password reset token"""
        
        # Get user
        user = AuthService.get_user_by_email(db, email)
        if not user or not user.reset_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Geçersiz veya süresi dolmuş kod"
            )
        
        # Check token
        if user.reset_token != token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Geçersiz kod"
            )
        
        # Check expiry
        if is_token_expired(user.reset_token_expires_at):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Kodun süresi dolmuş. Lütfen yeni kod isteyin"
            )
        
        return {"message": "Kod doğrulandı. Şimdi yeni şifrenizi belirleyebilirsiniz"}
    
    @staticmethod
    def reset_password(db: Session, email: str, token: str, new_password: str) -> dict:
        """Reset password with token"""
        
        # Verify token first
        AuthService.verify_reset_token(db, email, token)
        
        # Get user
        user = AuthService.get_user_by_email(db, email)
        
        # Update password
        user.password_hash = hash_password(new_password)
        user.reset_token = None
        user.reset_token_expires_at = None
        db.commit()
        
        return {"message": "Şifreniz başarıyla güncellendi"}
    
    @staticmethod
    def change_password(db: Session, user_id: int, old_password: str, new_password: str) -> dict:
        """Change password (when logged in)"""
        
        # Get user
        user = AuthService.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Kullanıcı bulunamadı"
            )
        
        # Verify old password
        if not verify_password(old_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mevcut şifre hatalı"
            )
        
        # Update password
        user.password_hash = hash_password(new_password)
        db.commit()
        
        return {"message": "Şifreniz başarıyla değiştirildi"}

    @staticmethod
    def admin_create_user(db: Session, email: str, password: str, full_name: str, role: str = 'user', company_id = None) -> User:
        """Admin creates a new user without logging in or returning tokens"""
        # Check existing
        existing_user = AuthService.get_user_by_email(db, email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bu email adresi zaten kayıtlı"
            )

        # Validate role
        role_obj = db.query(Role).filter(Role.name == role).first()
        if not role_obj:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Geçersiz rol")

        new_user = User(
            email=email,
            full_name=full_name,
            password_hash=hash_password(password),
            role_id=role_obj.id,
            company_id=company_id
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
