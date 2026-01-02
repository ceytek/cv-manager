"""
Agreement Module
Handles privacy/KVKK agreement templates for interview consent forms.
"""

# Models and Types can be imported directly (no circular import risk)
from app.modules.agreement.models import AgreementTemplate
from app.modules.agreement.types import (
    AgreementTemplateType,
    AgreementTemplateInput,
    AgreementTemplateResponse,
)

# Resolvers are NOT imported here to avoid circular imports
# Import them directly where needed:
# from app.modules.agreement.resolvers import ...


__all__ = [
    # Models
    "AgreementTemplate",
    # Types
    "AgreementTemplateType",
    "AgreementTemplateInput",
    "AgreementTemplateResponse",
]

