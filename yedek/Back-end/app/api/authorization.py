from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.role import Role
from app.models.user import User


def ensure_admin(user: User, db: Session):
    """Raise 403 if the given user is not admin."""
    role_name = None
    if user.role_id:
        r = db.query(Role).filter(Role.id == user.role_id).first()
        role_name = r.name if r else None
    if role_name != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu işlem için yetkiniz yok")
