"""
GraphQL Types for AI Interview Email Templates
"""
import strawberry
from typing import Optional, List
from datetime import datetime


@strawberry.type
class AIInterviewEmailTemplateType:
    """GraphQL type for AI Interview Email Template"""
    id: str
    name: str
    subject: str
    body: str
    language: str
    is_active: bool
    is_default: bool
    company_id: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


@strawberry.type
class AITemplateVariableType:
    """GraphQL type for AI interview template variables"""
    key: str
    label_tr: str
    label_en: str


@strawberry.input
class AIInterviewEmailTemplateInput:
    """Input type for creating AI Interview Email Template"""
    name: str
    subject: str
    body: str
    language: str = "TR"
    is_active: bool = True
    is_default: bool = False


@strawberry.input
class AIInterviewEmailTemplateUpdateInput:
    """Input type for updating AI Interview Email Template"""
    name: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    language: Optional[str] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None


@strawberry.type
class AIInterviewEmailTemplateResponse:
    """Response type for AI Interview Email Template mutations"""
    success: bool
    message: str
    template: Optional[AIInterviewEmailTemplateType] = None


@strawberry.type
class AIInterviewEmailTemplateListResponse:
    """Response type for listing templates with variables"""
    templates: List[AIInterviewEmailTemplateType]
    variables: List[AITemplateVariableType]
