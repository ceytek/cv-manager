"""
Job Outro Templates Module
Handles job conclusion/ending templates (What we offer, etc.)
"""
from app.modules.job_outro.models import JobOutroTemplate
from app.modules.job_outro.types import (
    JobOutroTemplateType,
    JobOutroTemplateInput,
    JobOutroTemplateResponse,
)
from app.modules.job_outro.resolvers import (
    get_job_outro_templates,
    create_job_outro_template,
    update_job_outro_template,
    delete_job_outro_template,
    toggle_job_outro_template,
)

__all__ = [
    "JobOutroTemplate",
    "JobOutroTemplateType",
    "JobOutroTemplateInput",
    "JobOutroTemplateResponse",
    "get_job_outro_templates",
    "create_job_outro_template",
    "update_job_outro_template",
    "delete_job_outro_template",
    "toggle_job_outro_template",
]

