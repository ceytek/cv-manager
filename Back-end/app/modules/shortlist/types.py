"""
GraphQL Types for Shortlist Module (Long List / Short List)
"""

import strawberry
from typing import Optional, List
from datetime import datetime


# ============================================
# Long List Types
# ============================================

@strawberry.type
class LonglistToggleResponseType:
    """Response type for longlist toggle operations"""
    success: bool
    message: str
    application_id: Optional[str] = None
    is_in_longlist: Optional[bool] = strawberry.field(name="isInLonglist", default=None)


@strawberry.type
class BulkLonglistResponseType:
    """Response type for bulk longlist operations"""
    success: bool
    message: str
    updated_count: int = strawberry.field(name="updatedCount")
    application_ids: List[str] = strawberry.field(name="applicationIds")


@strawberry.input
class LonglistToggleInput:
    """Input for toggling longlist status"""
    application_id: str = strawberry.field(name="applicationId")
    note: Optional[str] = None


@strawberry.input
class BulkLonglistInput:
    """Input for bulk longlist operations"""
    application_ids: List[str] = strawberry.field(name="applicationIds")
    add_to_longlist: bool = strawberry.field(name="addToLonglist")  # True = add, False = remove
    note: Optional[str] = None


# ============================================
# Short List Types
# ============================================

@strawberry.type
class ShortlistToggleResponseType:
    """Response type for shortlist toggle operations"""
    success: bool
    message: str
    application_id: Optional[str] = None
    is_shortlisted: Optional[bool] = None


@strawberry.type
class BulkShortlistResponseType:
    """Response type for bulk shortlist operations"""
    success: bool
    message: str
    updated_count: int
    application_ids: List[str]


@strawberry.type
class ShortlistShareType:
    """GraphQL type for ShortlistShare (used for both shortlist and longlist)"""
    id: str
    job_id: str
    token: str
    title: str
    message: Optional[str]
    expires_at: Optional[str]
    is_active: bool
    created_at: Optional[str]
    viewed_at: Optional[str]
    view_count: int
    share_url: str
    is_expired: bool
    list_type: str = strawberry.field(name="listType", default="shortlist")  # 'shortlist' or 'longlist'
    
    # Related data
    job_title: Optional[str] = None
    shortlisted_count: int = 0
    creator_name: Optional[str] = None


@strawberry.input
class ShortlistShareInput:
    """Input type for creating a shortlist/longlist share"""
    job_id: str = strawberry.field(name="jobId")
    title: str
    message: Optional[str] = None
    expires_in_days: Optional[int] = strawberry.field(name="expiresInDays", default=7)
    list_type: str = strawberry.field(name="listType", default="shortlist")  # 'shortlist' or 'longlist'


@strawberry.type
class ShortlistShareResponseType:
    """Response type for shortlist share operations"""
    success: bool
    message: str
    share: Optional[ShortlistShareType] = None


# Public types (for hiring manager view)
@strawberry.type
class PublicShortlistCandidateType:
    """Public view of a shortlisted candidate (limited info)"""
    id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    overall_score: Optional[int] = strawberry.field(name="overallScore", default=None)
    shortlist_note: Optional[str] = strawberry.field(name="shortlistNote", default=None)
    shortlisted_at: Optional[str] = strawberry.field(name="shortlistedAt", default=None)
    
    # Analysis summary (safe to share)
    experience_summary: Optional[str] = strawberry.field(name="experienceSummary", default=None)
    education_summary: Optional[str] = strawberry.field(name="educationSummary", default=None)
    skills: List[str] = strawberry.field(default_factory=list)
    location: Optional[str] = None
    
    # CV link (if allowed)
    cv_url: Optional[str] = strawberry.field(name="cvUrl", default=None)


@strawberry.type
class PublicShortlistType:
    """Public shortlist/longlist view for hiring managers"""
    id: str
    title: str
    message: Optional[str]
    job_title: str = strawberry.field(name="jobTitle")
    job_location: Optional[str] = strawberry.field(name="jobLocation", default=None)
    job_department: Optional[str] = strawberry.field(name="jobDepartment", default=None)
    company_name: str = strawberry.field(name="companyName")
    company_logo: Optional[str] = strawberry.field(name="companyLogo", default=None)
    list_type: str = strawberry.field(name="listType", default="shortlist")  # 'shortlist' or 'longlist'
    
    candidates: List[PublicShortlistCandidateType]
    candidate_count: int = strawberry.field(name="candidateCount")
    
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)
    expires_at: Optional[str] = strawberry.field(name="expiresAt", default=None)
    is_expired: bool = strawberry.field(name="isExpired")


@strawberry.input
class ShortlistToggleInput:
    """Input for toggling shortlist status"""
    application_id: str = strawberry.field(name="applicationId")
    note: Optional[str] = None


@strawberry.input
class BulkShortlistInput:
    """Input for bulk shortlist operations"""
    application_ids: List[str] = strawberry.field(name="applicationIds")
    add_to_shortlist: bool = strawberry.field(name="addToShortlist")  # True = add, False = remove
    note: Optional[str] = None
