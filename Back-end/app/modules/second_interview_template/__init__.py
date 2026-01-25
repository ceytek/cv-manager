"""
Second Interview Template Module
Handles email templates for second interview invitations
"""

from .models import SecondInterviewTemplate
from .types import (
    SecondInterviewTemplateType,
    SecondInterviewTemplateInput,
    SecondInterviewTemplateUpdateInput,
    SecondInterviewTemplateResponse
)
from .resolvers import (
    get_second_interview_templates,
    get_second_interview_template,
    create_second_interview_template,
    update_second_interview_template,
    delete_second_interview_template
)

__all__ = [
    'SecondInterviewTemplate',
    'SecondInterviewTemplateType',
    'SecondInterviewTemplateInput',
    'SecondInterviewTemplateUpdateInput',
    'SecondInterviewTemplateResponse',
    'get_second_interview_templates',
    'get_second_interview_template',
    'create_second_interview_template',
    'update_second_interview_template',
    'delete_second_interview_template'
]
