"""
Likert Email Template Module
Manages email templates for Likert test invitations
"""
from app.modules.likert_template.models import LikertEmailTemplate, LIKERT_TEMPLATE_VARIABLES
from app.modules.likert_template.types import (
    LikertEmailTemplateType,
    LikertEmailTemplateInput,
    LikertEmailTemplateUpdateInput,
    LikertEmailTemplateResponse,
    LikertEmailTemplateVariableType,
    LikertEmailTemplateVariablesResponse,
)
from app.modules.likert_template.resolvers import (
    get_likert_templates,
    get_likert_template,
    get_likert_template_variables,
    create_likert_template,
    update_likert_template,
    delete_likert_template,
)

__all__ = [
    # Models
    "LikertEmailTemplate",
    "LIKERT_TEMPLATE_VARIABLES",
    # Types
    "LikertEmailTemplateType",
    "LikertEmailTemplateInput",
    "LikertEmailTemplateUpdateInput",
    "LikertEmailTemplateResponse",
    "LikertEmailTemplateVariableType",
    "LikertEmailTemplateVariablesResponse",
    # Resolvers
    "get_likert_templates",
    "get_likert_template",
    "get_likert_template_variables",
    "create_likert_template",
    "update_likert_template",
    "delete_likert_template",
]
