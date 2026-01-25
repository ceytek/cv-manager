"""
GraphQL Types for Second Interview Template Module
"""
import strawberry
from typing import Optional, List
from enum import Enum


@strawberry.enum
class SecondInterviewTemplateTypeEnum(Enum):
    """Template type for different interview formats"""
    ONLINE = "online"
    IN_PERSON = "in_person"


@strawberry.type
class TemplateVariableType:
    """Represents a template variable that can be used in templates"""
    key: str
    label_tr: str = strawberry.field(name="labelTr")
    label_en: str = strawberry.field(name="labelEn")


@strawberry.type
class SecondInterviewTemplateType:
    """GraphQL type for second interview email templates"""
    id: str
    name: str
    template_type: SecondInterviewTemplateTypeEnum = strawberry.field(name="templateType")
    subject: str
    body: str
    language: str
    is_active: bool = strawberry.field(name="isActive")
    is_default: bool = strawberry.field(name="isDefault")
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)
    updated_at: Optional[str] = strawberry.field(name="updatedAt", default=None)


@strawberry.input
class SecondInterviewTemplateInput:
    """Input for creating second interview templates"""
    name: str
    template_type: SecondInterviewTemplateTypeEnum = strawberry.field(name="templateType")
    subject: str
    body: str
    language: Optional[str] = "TR"
    is_active: Optional[bool] = strawberry.field(name="isActive", default=True)
    is_default: Optional[bool] = strawberry.field(name="isDefault", default=False)


@strawberry.input
class SecondInterviewTemplateUpdateInput:
    """Input for updating second interview templates"""
    name: Optional[str] = None
    template_type: Optional[SecondInterviewTemplateTypeEnum] = strawberry.field(name="templateType", default=None)
    subject: Optional[str] = None
    body: Optional[str] = None
    language: Optional[str] = None
    is_active: Optional[bool] = strawberry.field(name="isActive", default=None)
    is_default: Optional[bool] = strawberry.field(name="isDefault", default=None)


@strawberry.type
class SecondInterviewTemplateResponse:
    """Response for second interview template mutations"""
    success: bool
    message: str
    template: Optional[SecondInterviewTemplateType] = None


@strawberry.type
class TemplateVariablesResponse:
    """Response containing available template variables"""
    online_variables: List[TemplateVariableType] = strawberry.field(name="onlineVariables")
    in_person_variables: List[TemplateVariableType] = strawberry.field(name="inPersonVariables")


__all__ = [
    "SecondInterviewTemplateTypeEnum",
    "TemplateVariableType",
    "SecondInterviewTemplateType",
    "SecondInterviewTemplateInput",
    "SecondInterviewTemplateUpdateInput",
    "SecondInterviewTemplateResponse",
    "TemplateVariablesResponse",
]
