"""
GraphQL Resolvers for History Module
"""
from typing import List, Optional
from datetime import datetime

from strawberry.types import Info

from app.api.dependencies import get_company_id_from_token, get_current_user_from_token
from app.modules.common import get_db_session
from app.modules.history.models import ActionType, ApplicationHistory, DEFAULT_ACTION_TYPES
from app.modules.history.types import (
    ActionTypeType,
    ApplicationHistoryType,
    LastStatusType,
    CreateHistoryEntryInput,
    HistoryResponse,
    HistoryListResponse,
    RecentActivityType,
    RecentActivitiesResponse,
)


# ============ Helper Functions ============

def seed_action_types(db) -> None:
    """Seed default action types if they don't exist"""
    for action_data in DEFAULT_ACTION_TYPES:
        existing = db.query(ActionType).filter(ActionType.code == action_data["code"]).first()
        if not existing:
            action = ActionType(
                code=action_data["code"],
                name_tr=action_data["name_tr"],
                name_en=action_data["name_en"],
                icon=action_data.get("icon"),
                color=action_data.get("color"),
                sort_order=action_data.get("sort_order", 0),
                is_system=True,
                company_id=None,  # System-wide
            )
            db.add(action)
    db.commit()


def get_action_type_by_code(db, code: str) -> Optional[ActionType]:
    """Get action type by code"""
    return db.query(ActionType).filter(ActionType.code == code).first()


def create_history_entry(
    db,
    company_id: str,
    application_id: str,
    candidate_id: str,
    job_id: str,
    action_code: str,
    performed_by: Optional[str] = None,
    note: Optional[str] = None,
    action_data: Optional[dict] = None,
) -> Optional[ApplicationHistory]:
    """
    Create a history entry for an application.
    This is a utility function that can be called from other modules.
    """
    action_type = get_action_type_by_code(db, action_code)
    if not action_type:
        # Try to seed and get again
        seed_action_types(db)
        action_type = get_action_type_by_code(db, action_code)
        if not action_type:
            return None
    
    entry = ApplicationHistory(
        company_id=company_id,
        application_id=application_id,
        candidate_id=candidate_id,
        job_id=job_id,
        action_type_id=action_type.id,
        performed_by=performed_by,
        note=note,
        action_data=action_data or {},
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


# ============ Query Resolvers ============

def get_action_types(info: Info) -> List[ActionTypeType]:
    """Get all action types"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    
    db = get_db_session()
    try:
        # Seed if needed
        seed_action_types(db)
        
        actions = db.query(ActionType).order_by(ActionType.sort_order).all()
        return [
            ActionTypeType(
                id=str(a.id),
                code=a.code,
                name_tr=a.name_tr,
                name_en=a.name_en,
                description=a.description,
                icon=a.icon,
                color=a.color,
                is_system=a.is_system,
                sort_order=a.sort_order,
            ) for a in actions
        ]
    finally:
        db.close()


def get_application_history(info: Info, application_id: str) -> HistoryListResponse:
    """Get full history for an application"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    try:
        _, token = auth_header.split()
    except ValueError:
        raise Exception("Invalid authorization header")
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        entries = db.query(ApplicationHistory).filter(
            ApplicationHistory.application_id == application_id,
            ApplicationHistory.company_id == company_id
        ).order_by(ApplicationHistory.created_at.desc()).all()
        
        result = []
        for entry in entries:
            action_type = entry.action_type
            performed_by_name = None
            if entry.performed_by_user:
                performed_by_name = entry.performed_by_user.full_name
            
            result.append(ApplicationHistoryType(
                id=str(entry.id),
                application_id=str(entry.application_id),
                candidate_id=str(entry.candidate_id),
                job_id=str(entry.job_id),
                action_type_id=str(entry.action_type_id),
                performed_by=str(entry.performed_by) if entry.performed_by else None,
                performed_by_name=performed_by_name,
                action_data=entry.action_data,
                note=entry.note,
                created_at=entry.created_at.isoformat(),
                action_type=ActionTypeType(
                    id=str(action_type.id),
                    code=action_type.code,
                    name_tr=action_type.name_tr,
                    name_en=action_type.name_en,
                    description=action_type.description,
                    icon=action_type.icon,
                    color=action_type.color,
                    is_system=action_type.is_system,
                    sort_order=action_type.sort_order,
                ) if action_type else None,
            ))
        
        return HistoryListResponse(
            success=True,
            entries=result,
            total=len(result),
        )
    except Exception as e:
        return HistoryListResponse(success=False, message=str(e), entries=[], total=0)
    finally:
        db.close()


def get_last_status(info: Info, application_id: str) -> Optional[LastStatusType]:
    """Get last status for an application (most recent history entry)"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    try:
        _, token = auth_header.split()
    except ValueError:
        raise Exception("Invalid authorization header")
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        entry = db.query(ApplicationHistory).filter(
            ApplicationHistory.application_id == application_id,
            ApplicationHistory.company_id == company_id
        ).order_by(ApplicationHistory.created_at.desc()).first()
        
        if not entry:
            return None
        
        action_type = entry.action_type
        if not action_type:
            return None
        
        return LastStatusType(
            action_code=action_type.code,
            action_name_tr=action_type.name_tr,
            action_name_en=action_type.name_en,
            color=action_type.color,
            icon=action_type.icon,
            created_at=entry.created_at.isoformat(),
        )
    finally:
        db.close()


# ============ Mutation Resolvers ============

async def add_history_entry(info: Info, input: CreateHistoryEntryInput) -> HistoryResponse:
    """Add a new history entry"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    try:
        _, token = auth_header.split()
    except ValueError:
        raise Exception("Invalid authorization header")
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        current_user = get_current_user_from_token(token, db)
        
        entry = create_history_entry(
            db=db,
            company_id=company_id,
            application_id=input.application_id,
            candidate_id=input.candidate_id,
            job_id=input.job_id,
            action_code=input.action_code,
            performed_by=str(current_user.id) if current_user else None,
            note=input.note,
            action_data=input.action_data,
        )
        
        if not entry:
            return HistoryResponse(success=False, message="Failed to create history entry - invalid action code")
        
        action_type = entry.action_type
        
        return HistoryResponse(
            success=True,
            message="History entry created",
            entry=ApplicationHistoryType(
                id=str(entry.id),
                application_id=str(entry.application_id),
                candidate_id=str(entry.candidate_id),
                job_id=str(entry.job_id),
                action_type_id=str(entry.action_type_id),
                performed_by=str(entry.performed_by) if entry.performed_by else None,
                performed_by_name=current_user.full_name if current_user else None,
                action_data=entry.action_data,
                note=entry.note,
                created_at=entry.created_at.isoformat(),
                action_type=ActionTypeType(
                    id=str(action_type.id),
                    code=action_type.code,
                    name_tr=action_type.name_tr,
                    name_en=action_type.name_en,
                    icon=action_type.icon,
                    color=action_type.color,
                    is_system=action_type.is_system,
                    sort_order=action_type.sort_order,
                ) if action_type else None,
            ),
        )
    except Exception as e:
        db.rollback()
        return HistoryResponse(success=False, message=str(e))
    finally:
        db.close()


async def seed_action_types_mutation(info: Info) -> HistoryResponse:
    """Seed default action types (admin only)"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    
    db = get_db_session()
    try:
        seed_action_types(db)
        return HistoryResponse(success=True, message="Action types seeded successfully")
    except Exception as e:
        db.rollback()
        return HistoryResponse(success=False, message=str(e))
    finally:
        db.close()


def get_recent_activities(info: Info, limit: int = 10) -> RecentActivitiesResponse:
    """Get recent activities across all applications for the company"""
    from app.models.candidate import Candidate
    from app.models.job import Job
    
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    try:
        _, token = auth_header.split()
    except ValueError:
        raise Exception("Invalid authorization header")
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        # Get recent history entries with joins
        entries = db.query(ApplicationHistory).filter(
            ApplicationHistory.company_id == company_id
        ).order_by(ApplicationHistory.created_at.desc()).limit(limit).all()
        
        result = []
        for entry in entries:
            action_type = entry.action_type
            if not action_type:
                continue
            
            # Get candidate name
            candidate = db.query(Candidate).filter(Candidate.id == entry.candidate_id).first()
            candidate_name = candidate.name if candidate else "Unknown"
            candidate_email = candidate.email if candidate else None
            
            # Get job title
            job = db.query(Job).filter(Job.id == entry.job_id).first()
            job_title = job.title if job else "Unknown"
            
            result.append(RecentActivityType(
                id=str(entry.id),
                application_id=str(entry.application_id),
                candidate_id=str(entry.candidate_id),
                candidate_name=candidate_name or "Unknown",
                candidate_email=candidate_email,
                job_id=str(entry.job_id),
                job_title=job_title or "Unknown",
                action_code=action_type.code,
                action_name_tr=action_type.name_tr,
                action_name_en=action_type.name_en,
                color=action_type.color,
                icon=action_type.icon,
                created_at=entry.created_at.isoformat(),
            ))
        
        return RecentActivitiesResponse(
            success=True,
            activities=result,
            total=len(result),
        )
    except Exception as e:
        return RecentActivitiesResponse(success=False, message=str(e), activities=[], total=0)
    finally:
        db.close()


__all__ = [
    # Helper functions (can be imported by other modules)
    "create_history_entry",
    "get_action_type_by_code",
    "seed_action_types",
    # Query resolvers
    "get_action_types",
    "get_application_history",
    "get_last_status",
    "get_recent_activities",
    # Mutation resolvers
    "add_history_entry",
    "seed_action_types_mutation",
]

