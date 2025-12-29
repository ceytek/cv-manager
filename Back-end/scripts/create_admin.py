import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.user import User
from app.models.role import Role
from app.core.database import Base
from app.utils.security import hash_password
from uuid import UUID

"""
Usage:
  python3 scripts/create_admin.py <company_id> <email> <full_name> <password>
Example:
  python3 scripts/create_admin.py 829525e7-0794-4334-b805-bd1e981f0276 admin@acme.test "Acme Admin" admin
"""

def main():
    if len(sys.argv) != 5:
        print("Args: <company_id> <email> <full_name> <password>")
        sys.exit(1)

    company_id, email, full_name, password = sys.argv[1:5]
    try:
        UUID(company_id)
    except ValueError:
        print("Invalid company_id UUID")
        sys.exit(1)

    engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    db = SessionLocal()
    try:
        # Ensure admin role exists
        admin_role = db.query(Role).filter(Role.name == 'admin').first()
        if not admin_role:
            print("Admin role not found, creating...")
            from uuid import uuid4
            admin_role = Role(id=str(uuid4()), name='admin')
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)

        # Check user exists
        if db.query(User).filter(User.email == email).first():
            print(f"User with email {email} already exists.")
            return

        user = User(
            email=email,
            full_name=full_name,
            password_hash=hash_password(password),
            role_id=admin_role.id,
            company_id=company_id,
            is_active=True,
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Admin user created: id={user.id} email={user.email} role=admin company_id={company_id}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
