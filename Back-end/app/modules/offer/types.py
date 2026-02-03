"""
GraphQL Types for Offer Module
"""

import strawberry
from typing import Optional, List
from strawberry.scalars import JSON


# ============================================
# Offer Template Types
# ============================================

@strawberry.type
class OfferTemplateType:
    """GraphQL type for OfferTemplate"""
    id: str
    name: str
    intro_text: Optional[str] = strawberry.field(name="introText", default=None)
    outro_text: Optional[str] = strawberry.field(name="outroText", default=None)
    default_validity_days: int = strawberry.field(name="defaultValidityDays", default=7)
    default_benefits: Optional[List['OfferBenefitType']] = strawberry.field(name="defaultBenefits", default=None)
    is_active: bool = strawberry.field(name="isActive", default=True)
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)
    updated_at: Optional[str] = strawberry.field(name="updatedAt", default=None)


@strawberry.input
class OfferTemplateInput:
    """Input type for creating/updating offer templates"""
    name: str
    intro_text: Optional[str] = strawberry.field(name="introText", default=None)
    outro_text: Optional[str] = strawberry.field(name="outroText", default=None)
    default_validity_days: int = strawberry.field(name="defaultValidityDays", default=7)
    default_benefits: Optional[List['OfferBenefitInput']] = strawberry.field(name="defaultBenefits", default=None)
    is_active: bool = strawberry.field(name="isActive", default=True)


@strawberry.type
class OfferTemplateResponseType:
    """Response type for offer template mutations"""
    success: bool
    message: str
    template: Optional[OfferTemplateType] = None


# ============================================
# Offer Types
# ============================================

@strawberry.type
class OfferBenefitType:
    """Benefit attached to an offer"""
    id: str
    name: str
    value: Optional[float] = None
    value_period: Optional[str] = strawberry.field(name="valuePeriod", default=None)
    is_variable: bool = strawberry.field(name="isVariable", default=False)
    category: Optional[str] = None
    icon: Optional[str] = None


@strawberry.type
class OfferType:
    """GraphQL type for Offer"""
    id: str
    application_id: str = strawberry.field(name="applicationId")
    template_id: Optional[str] = strawberry.field(name="templateId", default=None)
    token: str
    status: str
    
    # Salary
    salary_gross: Optional[float] = strawberry.field(name="salaryGross", default=None)
    salary_net: Optional[float] = strawberry.field(name="salaryNet", default=None)
    currency: str = "TRY"
    
    # Dates
    start_date: Optional[str] = strawberry.field(name="startDate", default=None)
    valid_until: Optional[str] = strawberry.field(name="validUntil", default=None)
    
    # Content
    intro_text: Optional[str] = strawberry.field(name="introText", default=None)
    outro_text: Optional[str] = strawberry.field(name="outroText", default=None)
    custom_notes: Optional[str] = strawberry.field(name="customNotes", default=None)
    
    # Benefits
    benefits: Optional[List[OfferBenefitType]] = None
    
    # PDF
    pdf_path: Optional[str] = strawberry.field(name="pdfPath", default=None)
    
    # Response tracking
    sent_at: Optional[str] = strawberry.field(name="sentAt", default=None)
    viewed_at: Optional[str] = strawberry.field(name="viewedAt", default=None)
    responded_at: Optional[str] = strawberry.field(name="respondedAt", default=None)
    response_note: Optional[str] = strawberry.field(name="responseNote", default=None)
    revision_count: int = strawberry.field(name="revisionCount", default=0)
    
    # Timestamps
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)
    updated_at: Optional[str] = strawberry.field(name="updatedAt", default=None)
    
    # Related data (populated in resolver)
    template: Optional[OfferTemplateType] = None
    candidate_name: Optional[str] = strawberry.field(name="candidateName", default=None)
    candidate_email: Optional[str] = strawberry.field(name="candidateEmail", default=None)
    job_title: Optional[str] = strawberry.field(name="jobTitle", default=None)


@strawberry.input
class OfferBenefitInput:
    """Input for benefit in offer"""
    id: str
    name: str
    value: Optional[float] = None
    value_period: Optional[str] = strawberry.field(name="valuePeriod", default=None)
    is_variable: bool = strawberry.field(name="isVariable", default=False)
    category: Optional[str] = None
    icon: Optional[str] = None


@strawberry.input
class OfferInput:
    """Input type for creating/updating offers"""
    application_id: str = strawberry.field(name="applicationId")
    template_id: Optional[str] = strawberry.field(name="templateId", default=None)
    
    # Salary
    salary_gross: Optional[float] = strawberry.field(name="salaryGross", default=None)
    salary_net: Optional[float] = strawberry.field(name="salaryNet", default=None)
    currency: str = "TRY"
    
    # Dates
    start_date: Optional[str] = strawberry.field(name="startDate", default=None)
    valid_until: Optional[str] = strawberry.field(name="validUntil", default=None)
    
    # Content
    intro_text: Optional[str] = strawberry.field(name="introText", default=None)
    outro_text: Optional[str] = strawberry.field(name="outroText", default=None)
    custom_notes: Optional[str] = strawberry.field(name="customNotes", default=None)
    
    # Benefits (JSON array)
    benefits: Optional[List[OfferBenefitInput]] = None


@strawberry.type
class OfferResponseType:
    """Response type for offer mutations"""
    success: bool
    message: str
    offer: Optional[OfferType] = None


@strawberry.input
class OfferResponseInput:
    """Input for candidate response to offer"""
    token: str
    response: str  # "accepted", "rejected", "revision_requested"
    note: Optional[str] = None


# ============================================
# Public Offer Type (for candidate portal)
# ============================================

@strawberry.type
class PublicOfferType:
    """Public offer type for candidate portal (limited info)"""
    id: str
    status: str
    
    # Company info
    company_name: str = strawberry.field(name="companyName")
    company_logo: Optional[str] = strawberry.field(name="companyLogo", default=None)
    
    # Job info
    job_title: str = strawberry.field(name="jobTitle")
    
    # Salary
    salary_gross: Optional[float] = strawberry.field(name="salaryGross", default=None)
    salary_net: Optional[float] = strawberry.field(name="salaryNet", default=None)
    currency: str = "TRY"
    
    # Dates
    start_date: Optional[str] = strawberry.field(name="startDate", default=None)
    valid_until: Optional[str] = strawberry.field(name="validUntil", default=None)
    
    # Content
    intro_text: Optional[str] = strawberry.field(name="introText", default=None)
    outro_text: Optional[str] = strawberry.field(name="outroText", default=None)
    
    # Benefits
    benefits: Optional[List[OfferBenefitType]] = None
    
    # PDF
    pdf_path: Optional[str] = strawberry.field(name="pdfPath", default=None)
    
    # Response status
    is_expired: bool = strawberry.field(name="isExpired", default=False)
    days_remaining: Optional[int] = strawberry.field(name="daysRemaining", default=None)
