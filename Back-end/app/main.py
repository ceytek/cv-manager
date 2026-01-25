from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from strawberry.fastapi import GraphQLRouter
import os
import uuid

from app.api.routes import auth
from app.api.routes import public
from app.core.database import engine, Base, SessionLocal
from sqlalchemy import inspect, text
from app.models.role import Role
from app.models.user import User
from app.graphql.resolvers import schema
from app.core.config import settings

# Import all module models to ensure they are registered with Base
from app.modules.second_interview.models import SecondInterview
from app.modules.second_interview_template.models import SecondInterviewTemplate
from app.modules.company_address.models import CompanyAddress

# Create database tables (base)
Base.metadata.create_all(bind=engine)

# Lightweight bootstrap to add roles and role_id without Alembic
def bootstrap_roles_and_fk():
    insp = inspect(engine)

    # Ensure roles table exists
    if not insp.has_table('roles'):
        Role.__table__.create(bind=engine, checkfirst=True)

    # Ensure users.role_id column exists
    columns = [c['name'] for c in insp.get_columns('users')]
    if 'role_id' not in columns:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN role_id VARCHAR(36)"))
            # Add FK if possible (some SQLite/PG differences). Try except for idempotency.
            try:
                conn.execute(text("ALTER TABLE users ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id)"))
            except Exception:
                pass
            conn.commit()

    # Ensure candidates.location column exists (lightweight migration)
    if insp.has_table('candidates'):
        cand_cols = [c['name'] for c in insp.get_columns('candidates')]
        if 'location' not in cand_cols:
            with engine.connect() as conn:
                try:
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN location VARCHAR(255)"))
                    conn.commit()
                except Exception:
                    pass
        # Ensure candidates.birth_year (rename from legacy 'age') and candidates.experience_months columns exist
        cand_cols = [c['name'] for c in insp.get_columns('candidates')]
        if 'birth_year' not in cand_cols:
            # If legacy 'age' exists, rename it to 'birth_year'; otherwise create fresh column
            if 'age' in cand_cols:
                with engine.connect() as conn:
                    try:
                        conn.execute(text("ALTER TABLE candidates RENAME COLUMN age TO birth_year"))
                        conn.commit()
                    except Exception:
                        # Fallback: if rename not supported (e.g. SQLite), create new column and copy values
                        try:
                            conn.execute(text("ALTER TABLE candidates ADD COLUMN birth_year INTEGER"))
                            # Best-effort copy
                            conn.execute(text("UPDATE candidates SET birth_year = age"))
                            conn.commit()
                        except Exception:
                            pass
            else:
                with engine.connect() as conn:
                    try:
                        conn.execute(text("ALTER TABLE candidates ADD COLUMN birth_year INTEGER"))
                        conn.commit()
                    except Exception:
                        pass
        if 'experience_months' not in cand_cols:
            with engine.connect() as conn:
                try:
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN experience_months INTEGER"))
                    conn.commit()
                except Exception:
                    pass

        # Sanitize implausible birth_years (e.g., > current_year-10 or < 1900) by setting NULL
        from datetime import datetime as _dt
        current_year = _dt.utcnow().year
        try:
            with engine.connect() as conn:
                conn.execute(text("UPDATE candidates SET birth_year = NULL WHERE birth_year IS NOT NULL AND (birth_year < 1900 OR birth_year > :maxy)"), {"maxy": current_year - 10})
                conn.commit()
        except Exception:
            pass

    # Seed roles and backfill
    db = SessionLocal()
    try:
    # Seed default roles
        existing = {r.name for r in db.query(Role).all()}
        for name in ('admin', 'user'):
            if name not in existing:
                db.add(Role(name=name))
        db.commit()

        # Backfill users without role to 'user'
        user_role = db.query(Role).filter(Role.name == 'user').first()
        if user_role:
            db.query(User).filter((User.role_id.is_(None))).update({User.role_id: user_role.id}, synchronize_session=False)
            db.commit()

        # First-run seed: if no users exist, create an admin
        users_count = db.query(User).count()
        if users_count == 0:
            from app.utils.security import hash_password
            admin_role = db.query(Role).filter(Role.name == 'admin').first()
            email = settings.ADMIN_EMAIL or 'admin@example.com'
            pwd = settings.ADMIN_PASSWORD or 'admin'
            full_name = settings.ADMIN_FULL_NAME or 'Admin'
            admin = User(
                email=email,
                full_name=full_name,
                password_hash=hash_password(pwd),
                role_id=admin_role.id if admin_role else None,
                is_verified=True
            )
            db.add(admin)
            db.commit()
        else:
            # Optional: seed initial admin if explicitly configured and not present
            if settings.ADMIN_EMAIL and settings.ADMIN_PASSWORD:
                admin_exists = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
                if not admin_exists:
                    admin_role = db.query(Role).filter(Role.name == 'admin').first()
                    from app.utils.security import hash_password
                    admin = User(
                        email=settings.ADMIN_EMAIL,
                        full_name=settings.ADMIN_FULL_NAME or 'Admin',
                        password_hash=hash_password(settings.ADMIN_PASSWORD),
                        role_id=admin_role.id if admin_role else None,
                        is_verified=True
                    )
                    db.add(admin)
                    db.commit()

        # One-time migration: if there is a seeded admin with admin@local.test, update to admin@example.com
        legacy = db.query(User).filter(User.email == 'admin@local.test').first()
        if legacy:
            exists_new = db.query(User).filter(User.email == 'admin@example.com').first()
            if not exists_new:
                legacy.email = 'admin@example.com'
                db.commit()
    finally:
        db.close()

bootstrap_roles_and_fk()


def seed_talent_pool_tags():
    """Seed system talent pool tags"""
    from app.modules.talent_pool.models import TalentPoolTag
    
    system_tags = [
        {"name": "İletişim Güçlü", "color": "#10b981"},
        {"name": "Dil Becerisi", "color": "#3b82f6"},
        {"name": "Teknik Yetkinlik", "color": "#8b5cf6"},
        {"name": "Liderlik Potansiyeli", "color": "#f59e0b"},
        {"name": "Yeni Mezun", "color": "#06b6d4"},
        {"name": "Deneyimli (5+ yıl)", "color": "#ef4444"},
        {"name": "Uzaktan Çalışmaya Uygun", "color": "#84cc16"},
        {"name": "Esnek Çalışma Saatleri", "color": "#ec4899"},
    ]
    
    db = SessionLocal()
    try:
        for tag_data in system_tags:
            existing = db.query(TalentPoolTag).filter(
                TalentPoolTag.is_system == True,
                TalentPoolTag.name == tag_data["name"]
            ).first()
            
            if not existing:
                tag = TalentPoolTag(
                    name=tag_data["name"],
                    color=tag_data["color"],
                    is_system=True,
                    is_active=True,
                    company_id=None  # System tags have no company
                )
                db.add(tag)
        
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding talent pool tags: {e}")
    finally:
        db.close()


seed_talent_pool_tags()

# FastAPI app
app = FastAPI(
    title="CV Manager API",
    description="İnsan Kaynakları CV Değerlendirme Sistemi API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://185.92.2.38:3000",
        "https://test.hrsmart.co",
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(public.router, tags=["public"])  # Public routes (no prefix, already has /api/public)

# GraphQL endpoint with multipart upload support
graphql_app = GraphQLRouter(
    schema, 
    path="/graphql",
    multipart_uploads_enabled=True
)
app.include_router(graphql_app, prefix="")


# Ensure uploads directory exists for interview videos
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads', 'interview_videos')
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Ensure uploads directory exists for logos
LOGO_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads', 'logos')
os.makedirs(LOGO_UPLOAD_DIR, exist_ok=True)

# Serve static files for uploaded videos
app.mount("/uploads", StaticFiles(directory=os.path.join(os.path.dirname(__file__), '..', 'uploads')), name="uploads")


@app.get("/")
def read_root():
    """Root endpoint"""
    return {"message": "Welcome to CV Manager API"}


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


@app.post("/upload-interview-video")
async def upload_interview_video(
    video: UploadFile = File(...),
    token: str = Form(...),
    questionId: str = Form(...)
):
    """
    Upload interview video for a specific question.
    Returns the URL where the video can be accessed.
    """
    try:
        # Generate unique filename
        file_extension = video.filename.split('.')[-1] if '.' in video.filename else 'webm'
        unique_filename = f"{token}_{questionId}_{uuid.uuid4().hex[:8]}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save the file
        content = await video.read()
        with open(file_path, 'wb') as f:
            f.write(content)
        
        # Return the URL (relative to the server)
        video_url = f"/uploads/interview_videos/{unique_filename}"
        
        return {
            "success": True,
            "videoUrl": video_url,
            "filename": unique_filename
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.post("/upload-logo")
async def upload_logo(
    file: UploadFile = File(...)
):
    """
    Upload company logo.
    Returns the URL where the logo can be accessed.
    """
    try:
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if file.content_type not in allowed_types:
            return {
                "success": False,
                "error": "Invalid file type. Allowed: JPEG, PNG, GIF, WebP"
            }
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'png'
        unique_filename = f"logo_{uuid.uuid4().hex[:12]}.{file_extension}"
        file_path = os.path.join(LOGO_UPLOAD_DIR, unique_filename)
        
        # Save the file
        content = await file.read()
        
        # Validate file size (max 2MB)
        if len(content) > 2 * 1024 * 1024:
            return {
                "success": False,
                "error": "File size must be less than 2MB"
            }
        
        with open(file_path, 'wb') as f:
            f.write(content)
        
        # Return the URL (relative to the server)
        logo_url = f"/uploads/logos/{unique_filename}"
        
        return {
            "success": True,
            "url": logo_url,
            "filename": unique_filename
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
