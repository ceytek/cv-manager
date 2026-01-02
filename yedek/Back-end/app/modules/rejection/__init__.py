"""
Rejection Module
Handles rejection email templates and application rejection functionality.
"""

# Models and Types can be imported directly (no circular import risk)
from app.modules.rejection.models import RejectionTemplate
from app.modules.rejection.types import (
    RejectionTemplateType,
    RejectionTemplateInput,
    RejectionTemplateResponse,
)

# Resolvers are NOT imported here to avoid circular imports
# Import them directly where needed:
# from app.modules.rejection.resolvers import RejectionTemplateQueries, RejectionTemplateMutations


__all__ = [
    # Models
    "RejectionTemplate",
    # Types
    "RejectionTemplateType",
    "RejectionTemplateInput",
    "RejectionTemplateResponse",
]
