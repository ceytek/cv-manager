"""
GraphQL Types for Likert Email Template Module
"""
import strawberry
from typing import Optional, List


@strawberry.type
class LikertEmailTemplateVariableType:
    """Represents a template variable that can be used in templates"""
    key: str
    label_tr: str = strawberry.field(name="labelTr")
    label_en: str = strawberry.field(name="labelEn")


@strawberry.type
class LikertEmailTemplateType:
    """GraphQL type for Likert test email templates"""
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
class LikertEmailTemplateInput:
    """Input for creating Likert test templates"""
    name: str
    subject: str
    body: str
    language: Optional[str] = "TR"
    is_active: Optional[bool] = strawberry.field(name="isActive", default=True)
    is_default: Optional[bool] = strawberry.field(name="isDefault", default=False)


@strawberry.input
class LikertEmailTemplateUpdateInput:
    """Input for updating Likert test templates"""
    name: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    language: Optional[str] = None
    is_active: Optional[bool] = strawberry.field(name="isActive", default=None)
    is_default: Optional[bool] = strawberry.field(name="isDefault", default=None)


@strawberry.type
class LikertEmailTemplateResponse:
    """Response for Likert test template mutations"""
    success: bool
    message: str
    template: Optional[LikertEmailTemplateType] = None


@strawberry.type
class LikertEmailTemplateVariablesResponse:
    """Response containing available template variables"""
    variables: List[LikertEmailTemplateVariableType]


__all__ = [
    "LikertEmailTemplateVariableType",
    "LikertEmailTemplateType",
    "LikertEmailTemplateInput",
    "LikertEmailTemplateUpdateInput",
    "LikertEmailTemplateResponse",
    "LikertEmailTemplateVariablesResponse",
]
