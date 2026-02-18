"""
Calendar Types - GraphQL types for calendar events
"""
import strawberry
from typing import Optional, List


@strawberry.type
class CalendarEventType:
    """A calendar event representing a scheduled activity"""
    id: str
    title: str
    event_type: str = strawberry.field(name="eventType")  # second_interview, ai_interview, likert_test
    
    # Schedule
    scheduled_date: str = strawberry.field(name="scheduledDate")  # YYYY-MM-DD
    scheduled_time: Optional[str] = strawberry.field(name="scheduledTime", default=None)  # HH:MM
    end_time: Optional[str] = strawberry.field(name="endTime", default=None)
    
    # Details
    candidate_name: Optional[str] = strawberry.field(name="candidateName", default=None)
    candidate_email: Optional[str] = strawberry.field(name="candidateEmail", default=None)
    candidate_photo: Optional[str] = strawberry.field(name="candidatePhoto", default=None)
    job_title: Optional[str] = strawberry.field(name="jobTitle", default=None)
    department_name: Optional[str] = strawberry.field(name="departmentName", default=None)
    
    # Interview specific
    interview_mode: Optional[str] = strawberry.field(name="interviewMode", default=None)  # online, in_person
    platform: Optional[str] = None  # zoom, teams, google_meet
    meeting_link: Optional[str] = strawberry.field(name="meetingLink", default=None)
    location_address: Optional[str] = strawberry.field(name="locationAddress", default=None)
    
    # Status
    status: str  # invited, in_progress, completed, expired, cancelled
    
    # Color coding
    color: Optional[str] = None  # hex color for UI
    
    # Reference IDs
    application_id: Optional[str] = strawberry.field(name="applicationId", default=None)
    
    # Timestamps
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)


@strawberry.type
class CalendarEventsResponse:
    """Response for calendar events query"""
    events: List[CalendarEventType]
    total_count: int = strawberry.field(name="totalCount", default=0)
