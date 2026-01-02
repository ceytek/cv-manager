"""
GraphQL Types for History Module
"""
import strawberry
from typing import Optional, List
from strawberry.scalars import JSON


@strawberry.type
class ActionTypeType:
    """GraphQL type for ActionType"""
    id: str
    code: str
    name_tr: str = strawberry.field(name="nameTr")
    name_en: str = strawberry.field(name="nameEn")
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_system: bool = strawberry.field(name="isSystem", default=True)
    sort_order: int = strawberry.field(name="sortOrder", default=0)


@strawberry.type
class ApplicationHistoryType:
    """GraphQL type for ApplicationHistory"""
    id: str
    application_id: str = strawberry.field(name="applicationId")
    candidate_id: str = strawberry.field(name="candidateId")
    job_id: str = strawberry.field(name="jobId")
    action_type_id: str = strawberry.field(name="actionTypeId")
    performed_by: Optional[str] = strawberry.field(name="performedBy", default=None)
    performed_by_name: Optional[str] = strawberry.field(name="performedByName", default=None)
    action_data: Optional[JSON] = strawberry.field(name="actionData", default=None)
    note: Optional[str] = None
    created_at: str = strawberry.field(name="createdAt")
    
    # Nested action type info
    action_type: Optional[ActionTypeType] = strawberry.field(name="actionType", default=None)


@strawberry.type
class LastStatusType:
    """GraphQL type for last status (simplified view)"""
    action_code: str = strawberry.field(name="actionCode")
    action_name_tr: str = strawberry.field(name="actionNameTr")
    action_name_en: str = strawberry.field(name="actionNameEn")
    color: Optional[str] = None
    icon: Optional[str] = None
    created_at: str = strawberry.field(name="createdAt")


@strawberry.input
class CreateHistoryEntryInput:
    """Input for creating a history entry"""
    application_id: str = strawberry.field(name="applicationId")
    candidate_id: str = strawberry.field(name="candidateId")
    job_id: str = strawberry.field(name="jobId")
    action_code: str = strawberry.field(name="actionCode")
    note: Optional[str] = None
    action_data: Optional[JSON] = strawberry.field(name="actionData", default=None)


@strawberry.type
class HistoryResponse:
    """Response type for history operations"""
    success: bool
    message: Optional[str] = None
    entry: Optional[ApplicationHistoryType] = None


@strawberry.type
class HistoryListResponse:
    """Response type for listing history"""
    success: bool
    message: Optional[str] = None
    entries: List[ApplicationHistoryType] = strawberry.field(default_factory=list)
    total: int = 0


@strawberry.type
class RecentActivityType:
    """GraphQL type for recent activity (with candidate and job info)"""
    id: str
    application_id: str = strawberry.field(name="applicationId")
    candidate_id: str = strawberry.field(name="candidateId")
    candidate_name: str = strawberry.field(name="candidateName")
    candidate_email: Optional[str] = strawberry.field(name="candidateEmail", default=None)
    job_id: str = strawberry.field(name="jobId")
    job_title: str = strawberry.field(name="jobTitle")
    action_code: str = strawberry.field(name="actionCode")
    action_name_tr: str = strawberry.field(name="actionNameTr")
    action_name_en: str = strawberry.field(name="actionNameEn")
    color: Optional[str] = None
    icon: Optional[str] = None
    created_at: str = strawberry.field(name="createdAt")


@strawberry.type
class RecentActivitiesResponse:
    """Response type for recent activities"""
    success: bool
    message: Optional[str] = None
    activities: List[RecentActivityType] = strawberry.field(default_factory=list)
    total: int = 0


__all__ = [
    "ActionTypeType",
    "ApplicationHistoryType",
    "LastStatusType",
    "CreateHistoryEntryInput",
    "HistoryResponse",
    "HistoryListResponse",
    "RecentActivityType",
    "RecentActivitiesResponse",
]

