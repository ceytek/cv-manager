"""
AI Interview Email Template Module
Email templates for AI interview invitations
"""
from .models import AIInterviewEmailTemplate, AI_INTERVIEW_TEMPLATE_VARIABLES
from .types import AIInterviewEmailTemplateType, AIInterviewEmailTemplateInput, AIInterviewEmailTemplateResponse

__all__ = [
    'AIInterviewEmailTemplate',
    'AI_INTERVIEW_TEMPLATE_VARIABLES',
    'AIInterviewEmailTemplateType',
    'AIInterviewEmailTemplateInput',
    'AIInterviewEmailTemplateResponse',
]
