"""
Common types and utilities shared across all modules.
"""

import strawberry
from typing import Optional

from app.modules.common.database import get_db_session


@strawberry.type
class MessageType:
    """GraphQL Message type for simple responses"""
    message: str
    success: bool


@strawberry.type
class GenericResponse:
    """Generic response type for mutations"""
    success: bool
    message: str
    data: Optional[str] = None


__all__ = [
    "MessageType",
    "GenericResponse",
    "get_db_session",
]

