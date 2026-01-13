"""
GraphQL Resolvers for Job Intro Module
"""
from typing import List
from strawberry.types import Info

from app.api.dependencies import get_company_id_from_token, get_current_user_from_token
from app.modules.common import get_db_session, MessageType
from app.modules.job_intro.models import JobIntroTemplate
from app.modules.job_intro.types import (
    JobIntroTemplateType,
    JobIntroTemplateInput,
    JobIntroTemplateResponse,
)


# ============ Query Resolvers ============

def get_job_intro_templates(info: Info, active_only: bool = False) -> List[JobIntroTemplateType]:
    """Get all job intro templates for the current company"""
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
        query = db.query(JobIntroTemplate).filter(
            JobIntroTemplate.company_id == company_id
        )
        
        if active_only:
            query = query.filter(JobIntroTemplate.is_active == True)
            
        templates = query.order_by(JobIntroTemplate.created_at.desc()).all()
        
        return [
            JobIntroTemplateType(
                id=str(t.id),
                name=t.name,
                content=t.content,
                is_active=t.is_active,
                creator_name=t.creator.full_name if t.creator else None,
                created_at=t.created_at.isoformat(),
                updated_at=t.updated_at.isoformat() if t.updated_at else None,
            ) for t in templates
        ]
    finally:
        db.close()


# ============ Mutation Resolvers ============

async def create_job_intro_template(info: Info, input: JobIntroTemplateInput) -> JobIntroTemplateResponse:
    """Create a new job intro template"""
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
        current = get_current_user_from_token(token, db)
        
        template = JobIntroTemplate(
            company_id=company_id,
            created_by=current.id,
            name=input.name,
            content=input.content,
            is_active=input.is_active,
        )
        db.add(template)
        db.commit()
        db.refresh(template)
        
        return JobIntroTemplateResponse(
            success=True,
            message="Job intro template created",
            template=JobIntroTemplateType(
                id=str(template.id),
                name=template.name,
                content=template.content,
                is_active=template.is_active,
                creator_name=current.full_name,
                created_at=template.created_at.isoformat(),
                updated_at=None,
            ),
        )
    except Exception as e:
        db.rollback()
        return JobIntroTemplateResponse(success=False, message=str(e), template=None)
    finally:
        db.close()


async def update_job_intro_template(info: Info, id: str, input: JobIntroTemplateInput) -> JobIntroTemplateResponse:
    """Update a job intro template"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    
    db = get_db_session()
    try:
        template = db.query(JobIntroTemplate).filter(JobIntroTemplate.id == id).first()
        if not template:
            return JobIntroTemplateResponse(success=False, message="Template not found", template=None)
        
        template.name = input.name
        template.content = input.content
        template.is_active = input.is_active
        db.commit()
        db.refresh(template)
        
        return JobIntroTemplateResponse(
            success=True,
            message="Job intro template updated",
            template=JobIntroTemplateType(
                id=str(template.id),
                name=template.name,
                content=template.content,
                is_active=template.is_active,
                creator_name=template.creator.full_name if template.creator else None,
                created_at=template.created_at.isoformat(),
                updated_at=template.updated_at.isoformat() if template.updated_at else None,
            ),
        )
    except Exception as e:
        db.rollback()
        return JobIntroTemplateResponse(success=False, message=str(e), template=None)
    finally:
        db.close()


async def delete_job_intro_template(info: Info, id: str) -> MessageType:
    """Delete a job intro template"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    
    db = get_db_session()
    try:
        template = db.query(JobIntroTemplate).filter(JobIntroTemplate.id == id).first()
        if not template:
            return MessageType(success=False, message="Template not found")
        
        db.delete(template)
        db.commit()
        return MessageType(success=True, message="Template deleted")
    except Exception as e:
        db.rollback()
        return MessageType(success=False, message=str(e))
    finally:
        db.close()


async def toggle_job_intro_template(info: Info, id: str) -> JobIntroTemplateResponse:
    """Toggle job intro template active status"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    
    db = get_db_session()
    try:
        template = db.query(JobIntroTemplate).filter(JobIntroTemplate.id == id).first()
        if not template:
            return JobIntroTemplateResponse(success=False, message="Template not found", template=None)
        
        template.is_active = not template.is_active
        db.commit()
        db.refresh(template)
        
        return JobIntroTemplateResponse(
            success=True,
            message=f"Template {'activated' if template.is_active else 'deactivated'}",
            template=JobIntroTemplateType(
                id=str(template.id),
                name=template.name,
                content=template.content,
                is_active=template.is_active,
                creator_name=template.creator.full_name if template.creator else None,
                created_at=template.created_at.isoformat(),
                updated_at=template.updated_at.isoformat() if template.updated_at else None,
            ),
        )
    except Exception as e:
        db.rollback()
        return JobIntroTemplateResponse(success=False, message=str(e), template=None)
    finally:
        db.close()


