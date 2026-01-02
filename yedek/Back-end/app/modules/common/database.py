"""
Common database utilities for modules
"""
from sqlalchemy.orm import Session
from app.core.database import get_db


def get_db_session() -> Session:
    """Get a new database session"""
    return next(get_db())

