from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings

# Sync engine (legacy compatibility)
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Async engine/session
_async_url = (
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    if settings.DATABASE_URL.startswith("postgresql://") else settings.DATABASE_URL
)
async_engine = create_async_engine(
    _async_url,
    pool_pre_ping=True,
    echo=True
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    expire_on_commit=False,
    class_=AsyncSession,
    autoflush=False,
    autocommit=False
)

# Base class for models
Base = declarative_base()


def get_db():
    """Sync database session dependency (legacy)"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_async_session():
    """Async DB session dependency generator"""
    async with AsyncSessionLocal() as session:
        yield session
