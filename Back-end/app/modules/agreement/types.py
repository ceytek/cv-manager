"""
GraphQL Types for Agreement Module
"""
import strawberry
from typing import Optional


@strawberry.type
class AgreementTemplateType:
    """Agreement template type"""
    id: str
    name: str
    content: str
    is_active: bool = strawberry.field(name="isActive", default=True)
    creator_name: Optional[str] = strawberry.field(name="creatorName", default=None)
    created_at: str = strawberry.field(name="createdAt")
    updated_at: Optional[str] = strawberry.field(name="updatedAt", default=None)


@strawberry.input
class AgreementTemplateInput:
    """Input for creating/updating agreement template"""
    name: str
    content: str
    is_active: bool = strawberry.field(name="isActive", default=True)


@strawberry.type
class AgreementTemplateResponse:
    """Response for agreement template mutations"""
    success: bool
    message: Optional[str] = None
    template: Optional[AgreementTemplateType] = None


__all__ = [
    "AgreementTemplateType",
    "AgreementTemplateInput",
    "AgreementTemplateResponse",
]
