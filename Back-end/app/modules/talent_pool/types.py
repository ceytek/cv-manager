"""
GraphQL Types for Talent Pool Module
"""
import strawberry
from typing import Optional, List


# ============================================
# Basic Types
# ============================================

@strawberry.type
class TalentPoolTagType:
    """Tag type for talent pool categorization"""
    id: str
    name: str
    color: str
    is_system: bool = strawberry.field(name="isSystem", default=False)
    is_active: bool = strawberry.field(name="isActive", default=True)
    usage_count: int = strawberry.field(name="usageCount", default=0)  # How many candidates have this tag
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)


@strawberry.type
class TalentPoolCandidateType:
    """Candidate info for talent pool display"""
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    cv_photo_path: Optional[str] = strawberry.field(name="cvPhotoPath", default=None)
    cv_file_path: Optional[str] = strawberry.field(name="cvFilePath", default=None)
    location: Optional[str] = None
    experience_months: Optional[int] = strawberry.field(name="experienceMonths", default=None)
    cv_file_name: Optional[str] = strawberry.field(name="cvFileName", default=None)


@strawberry.type
class TalentPoolSourceJobType:
    """Source job info for talent pool entry"""
    id: str
    title: str


@strawberry.type
class TalentPoolAddedByType:
    """User who added the entry"""
    id: int
    full_name: str = strawberry.field(name="name")


@strawberry.type
class TalentPoolEntryType:
    """Talent pool entry type"""
    id: str
    notes: Optional[str] = None
    status: str = "active"
    added_at: Optional[str] = strawberry.field(name="addedAt", default=None)
    updated_at: Optional[str] = strawberry.field(name="updatedAt", default=None)
    
    # Nested objects
    candidate: Optional[TalentPoolCandidateType] = None
    source_job: Optional[TalentPoolSourceJobType] = strawberry.field(name="sourceJob", default=None)
    added_by: Optional[TalentPoolAddedByType] = strawberry.field(name="addedBy", default=None)
    tags: List[TalentPoolTagType] = strawberry.field(default_factory=list)


# ============================================
# Input Types
# ============================================

@strawberry.input
class TalentPoolTagInput:
    """Input for creating/updating a tag"""
    name: str
    color: str = "#6366f1"


@strawberry.input
class TalentPoolTagUpdateInput:
    """Input for updating a tag"""
    name: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = strawberry.field(name="isActive", default=None)


@strawberry.input
class TalentPoolEntryInput:
    """Input for adding a candidate to talent pool"""
    candidate_id: str = strawberry.field(name="candidateId")
    source_job_id: Optional[str] = strawberry.field(name="sourceJobId", default=None)
    notes: Optional[str] = None
    tag_ids: List[str] = strawberry.field(name="tagIds", default_factory=list)


@strawberry.input
class TalentPoolBulkAddInput:
    """Input for bulk adding candidates to talent pool"""
    candidate_ids: List[str] = strawberry.field(name="candidateIds")
    source_job_id: Optional[str] = strawberry.field(name="sourceJobId", default=None)
    notes: Optional[str] = None
    tag_ids: List[str] = strawberry.field(name="tagIds", default_factory=list)


@strawberry.input
class TalentPoolEntryUpdateInput:
    """Input for updating a talent pool entry"""
    notes: Optional[str] = None
    tag_ids: Optional[List[str]] = strawberry.field(name="tagIds", default=None)


@strawberry.input
class TalentPoolAssignToJobInput:
    """Input for assigning a candidate from talent pool to a job"""
    entry_id: str = strawberry.field(name="entryId")
    department_id: str = strawberry.field(name="departmentId")
    job_id: str = strawberry.field(name="jobId")
    remove_from_pool: bool = strawberry.field(name="removeFromPool", default=True)


# ============================================
# Response Types
# ============================================

@strawberry.type
class TalentPoolTagResponse:
    """Response for tag mutations"""
    success: bool
    message: Optional[str] = None
    tag: Optional[TalentPoolTagType] = None


@strawberry.type
class TalentPoolEntryResponse:
    """Response for entry mutations"""
    success: bool
    message: Optional[str] = None
    entry: Optional[TalentPoolEntryType] = None


@strawberry.type
class TalentPoolBulkResponse:
    """Response for bulk operations"""
    success: bool
    message: Optional[str] = None
    added_count: int = strawberry.field(name="addedCount", default=0)
    skipped_count: int = strawberry.field(name="skippedCount", default=0)  # Already in pool


@strawberry.type
class TalentPoolStatsType:
    """Statistics for talent pool"""
    total_candidates: int = strawberry.field(name="totalCandidates", default=0)
    active_candidates: int = strawberry.field(name="activeCandidates", default=0)
    archived_candidates: int = strawberry.field(name="archivedCandidates", default=0)
    total_tags: int = strawberry.field(name="totalTags", default=0)


# ============================================
# Filter/Pagination Types
# ============================================

@strawberry.input
class TalentPoolFilterInput:
    """Filter input for querying talent pool"""
    search: Optional[str] = None  # Search in candidate name, email
    tag_ids: Optional[List[str]] = strawberry.field(name="tagIds", default=None)
    status: Optional[str] = None  # active, archived
    sort_by: Optional[str] = strawberry.field(name="sortBy", default="added_at")  # added_at, name
    sort_order: Optional[str] = strawberry.field(name="sortOrder", default="desc")  # asc, desc


__all__ = [
    # Basic Types
    "TalentPoolTagType",
    "TalentPoolCandidateType",
    "TalentPoolSourceJobType",
    "TalentPoolAddedByType",
    "TalentPoolEntryType",
    # Input Types
    "TalentPoolTagInput",
    "TalentPoolTagUpdateInput",
    "TalentPoolEntryInput",
    "TalentPoolBulkAddInput",
    "TalentPoolEntryUpdateInput",
    "TalentPoolAssignToJobInput",
    # Response Types
    "TalentPoolTagResponse",
    "TalentPoolEntryResponse",
    "TalentPoolBulkResponse",
    "TalentPoolStatsType",
    # Filter Types
    "TalentPoolFilterInput",
]
