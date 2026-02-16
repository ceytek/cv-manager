"""
GraphQL Types for Rejection Module
"""
import strawberry
from typing import Optional


@strawberry.type
class RejectionTemplateType:
    """GraphQL type for rejection email templates"""
    id: str
    name: str
    subject: str
    body: str
    language: str
    is_active: bool = strawberry.field(name="isActive")
    is_default: bool = strawberry.field(name="isDefault")
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)
    updated_at: Optional[str] = strawberry.field(name="updatedAt", default=None)


@strawberry.input
class RejectionTemplateInput:
    """Input for creating rejection templates"""
    name: str
    subject: str
    body: str
    language: Optional[str] = "TR"
    is_active: Optional[bool] = strawberry.field(name="isActive", default=True)
    is_default: Optional[bool] = strawberry.field(name="isDefault", default=False)


@strawberry.input
class RejectionTemplateUpdateInput:
    """Input for updating rejection templates - all fields optional"""
    name: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    language: Optional[str] = None
    is_active: Optional[bool] = strawberry.field(name="isActive", default=None)
    is_default: Optional[bool] = strawberry.field(name="isDefault", default=None)


@strawberry.type
class RejectionTemplateResponse:
    """Response for rejection template mutations"""
    success: bool
    message: str
    template: Optional[RejectionTemplateType] = None


__all__ = [
    "RejectionTemplateType",
    "RejectionTemplateInput",
    "RejectionTemplateUpdateInput",
    "RejectionTemplateResponse",
]


