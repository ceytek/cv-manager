"""
Calendar Resolvers - Aggregates events from multiple sources
"""
from datetime import datetime, date, timedelta
from typing import Optional, List
from strawberry.types import Info

from app.core.database import get_db_session
from app.modules.calendar.types import CalendarEventType, CalendarEventsResponse


def get_calendar_events(
    info: Info,
    start_date: str,
    end_date: str,
    event_types: Optional[List[str]] = None,
) -> CalendarEventsResponse:
    """
    Get all calendar events within a date range.
    Aggregates from: second_interviews, interview_sessions, likert_sessions
    """
    from app.modules.second_interview.models import SecondInterview
    from app.modules.interview.models import InterviewSession
    from app.modules.likert.models import LikertSession
    from app.models.candidate import Candidate
    from app.models.job import Job
    from app.models.department import Department
    
    # Auth
    user = info.context.get("user")
    if not user:
        return CalendarEventsResponse(events=[], total_count=0)
    
    company_id = user.get("company_id")
    if not company_id:
        return CalendarEventsResponse(events=[], total_count=0)
    
    db = get_db_session()
    events: List[CalendarEventType] = []
    
    try:
        # Parse date range
        try:
            start = date.fromisoformat(start_date)
            end = date.fromisoformat(end_date)
        except (ValueError, TypeError):
            start = date.today() - timedelta(days=7)
            end = date.today() + timedelta(days=30)
        
        filter_types = event_types or ['second_interview', 'ai_interview', 'likert_test']
        
        # ============================================
        # 1. Second Interviews (Yüzyüze/Online Mülakat)
        # ============================================
        if 'second_interview' in filter_types:
            from app.models.application import Application
            
            interviews = (
                db.query(SecondInterview)
                .join(Application, Application.id == SecondInterview.application_id)
                .filter(
                    SecondInterview.company_id == company_id,
                    SecondInterview.scheduled_date >= start,
                    SecondInterview.scheduled_date <= end,
                )
                .all()
            )
            
            for iv in interviews:
                app = db.query(Application).filter(Application.id == iv.application_id).first()
                candidate = db.query(Candidate).filter(Candidate.id == app.candidate_id).first() if app else None
                job = db.query(Job).filter(Job.id == app.job_id).first() if app else None
                dept = db.query(Department).filter(Department.id == job.department_id).first() if job and job.department_id else None
                
                # Determine color based on interview type
                color = '#8B5CF6' if str(iv.interview_type) == 'SecondInterviewType.ONLINE' or iv.interview_type == 'online' else '#F59E0B'
                
                # Map status
                status_str = str(iv.status).replace('SecondInterviewStatus.', '').lower() if iv.status else 'invited'
                
                events.append(CalendarEventType(
                    id=f"si-{iv.id}",
                    title=f"{candidate.name if candidate else 'Aday'} - {job.title if job else 'Pozisyon'}",
                    event_type="second_interview",
                    scheduled_date=str(iv.scheduled_date),
                    scheduled_time=iv.scheduled_time,
                    end_time=None,
                    candidate_name=candidate.name if candidate else None,
                    candidate_email=candidate.email if candidate else None,
                    candidate_photo=candidate.cv_photo_path if candidate else None,
                    job_title=job.title if job else None,
                    department_name=dept.name if dept else None,
                    interview_mode='online' if (str(iv.interview_type) == 'SecondInterviewType.ONLINE' or iv.interview_type == 'online') else 'in_person',
                    platform=str(iv.platform).replace('SecondInterviewPlatform.', '').lower() if iv.platform else None,
                    meeting_link=iv.meeting_link,
                    location_address=iv.location_address,
                    status=status_str,
                    color=color,
                    application_id=iv.application_id,
                    created_at=iv.created_at.isoformat() if iv.created_at else None,
                ))
        
        # ============================================
        # 2. AI Interview Sessions
        # ============================================
        if 'ai_interview' in filter_types:
            from app.models.application import Application
            
            ai_sessions = (
                db.query(InterviewSession)
                .filter(
                    InterviewSession.company_id == company_id,
                    InterviewSession.created_at >= datetime.combine(start, datetime.min.time()),
                    InterviewSession.created_at <= datetime.combine(end, datetime.max.time()),
                )
                .all()
            )
            
            for sess in ai_sessions:
                candidate = db.query(Candidate).filter(Candidate.id == sess.candidate_id).first()
                job = db.query(Job).filter(Job.id == sess.job_id).first()
                dept = db.query(Department).filter(Department.id == job.department_id).first() if job and job.department_id else None
                
                # Use expires_at as the deadline date
                sched_date = sess.expires_at.date() if sess.expires_at else (sess.created_at.date() if sess.created_at else date.today())
                
                events.append(CalendarEventType(
                    id=f"ai-{sess.id}",
                    title=f"{candidate.name if candidate else 'Aday'} - AI Mülakat",
                    event_type="ai_interview",
                    scheduled_date=str(sched_date),
                    scheduled_time=sess.expires_at.strftime('%H:%M') if sess.expires_at else None,
                    end_time=None,
                    candidate_name=candidate.name if candidate else None,
                    candidate_email=candidate.email if candidate else None,
                    candidate_photo=candidate.cv_photo_path if candidate else None,
                    job_title=job.title if job else None,
                    department_name=dept.name if dept else None,
                    interview_mode=None,
                    platform=None,
                    meeting_link=None,
                    location_address=None,
                    status=sess.status or 'pending',
                    color='#3B82F6',
                    application_id=sess.application_id,
                    created_at=sess.created_at.isoformat() if sess.created_at else None,
                ))
        
        # ============================================
        # 3. Likert Test Sessions
        # ============================================
        if 'likert_test' in filter_types:
            likert_sessions = (
                db.query(LikertSession)
                .filter(
                    LikertSession.company_id == company_id,
                    LikertSession.created_at >= datetime.combine(start, datetime.min.time()),
                    LikertSession.created_at <= datetime.combine(end, datetime.max.time()),
                )
                .all()
            )
            
            for sess in likert_sessions:
                candidate = db.query(Candidate).filter(Candidate.id == sess.candidate_id).first()
                job = db.query(Job).filter(Job.id == sess.job_id).first()
                dept = db.query(Department).filter(Department.id == job.department_id).first() if job and job.department_id else None
                
                sched_date = sess.expires_at.date() if sess.expires_at else (sess.created_at.date() if sess.created_at else date.today())
                
                events.append(CalendarEventType(
                    id=f"lt-{sess.id}",
                    title=f"{candidate.name if candidate else 'Aday'} - Likert Test",
                    event_type="likert_test",
                    scheduled_date=str(sched_date),
                    scheduled_time=sess.expires_at.strftime('%H:%M') if sess.expires_at else None,
                    end_time=None,
                    candidate_name=candidate.name if candidate else None,
                    candidate_email=candidate.email if candidate else None,
                    candidate_photo=candidate.cv_photo_path if candidate else None,
                    job_title=job.title if job else None,
                    department_name=dept.name if dept else None,
                    interview_mode=None,
                    platform=None,
                    meeting_link=None,
                    location_address=None,
                    status=sess.status or 'pending',
                    color='#10B981',
                    application_id=sess.application_id,
                    created_at=sess.created_at.isoformat() if sess.created_at else None,
                ))
        
        # Sort events by date and time
        events.sort(key=lambda e: (e.scheduled_date, e.scheduled_time or '00:00'))
        
        return CalendarEventsResponse(
            events=events,
            total_count=len(events),
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return CalendarEventsResponse(events=[], total_count=0)
    finally:
        db.close()
