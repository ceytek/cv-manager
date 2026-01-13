"""
GraphQL Types for Job Outro Module
"""
import strawberry
from typing import Optional


@strawberry.type
class JobOutroTemplateType:
    """Job outro template type"""
    id: str
    name: str
    content: str
    is_active: bool = strawberry.field(name="isActive", default=True)
    creator_name: Optional[str] = strawberry.field(name="creatorName", default=None)
    created_at: str = strawberry.field(name="createdAt")
    updated_at: Optional[str] = strawberry.field(name="updatedAt", default=None)


@strawberry.input
class JobOutroTemplateInput:
    """Input for creating/updating job outro template"""
    name: str
    content: str
    is_active: bool = strawberry.field(name="isActive", default=True)


@strawberry.type
class JobOutroTemplateResponse:
    """Response for job outro template mutations"""
    success: bool
    message: Optional[str] = None
    template: Optional[JobOutroTemplateType] = None


__all__ = [
    "JobOutroTemplateType",
    "JobOutroTemplateInput",
    "JobOutroTemplateResponse",
]


