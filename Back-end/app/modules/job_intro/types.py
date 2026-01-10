"""
GraphQL Types for Job Intro Module
"""
import strawberry
from typing import Optional


@strawberry.type
class JobIntroTemplateType:
    """Job intro template type"""
    id: str
    name: str
    content: str
    is_active: bool = strawberry.field(name="isActive", default=True)
    creator_name: Optional[str] = strawberry.field(name="creatorName", default=None)
    created_at: str = strawberry.field(name="createdAt")
    updated_at: Optional[str] = strawberry.field(name="updatedAt", default=None)


@strawberry.input
class JobIntroTemplateInput:
    """Input for creating/updating job intro template"""
    name: str
    content: str
    is_active: bool = strawberry.field(name="isActive", default=True)


@strawberry.type
class JobIntroTemplateResponse:
    """Response for job intro template mutations"""
    success: bool
    message: Optional[str] = None
    template: Optional[JobIntroTemplateType] = None


__all__ = [
    "JobIntroTemplateType",
    "JobIntroTemplateInput",
    "JobIntroTemplateResponse",
]

