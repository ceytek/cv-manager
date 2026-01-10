"""
GraphQL Resolvers for Job Outro Module
"""
from typing import List
from strawberry.types import Info

from app.api.dependencies import get_company_id_from_token, get_current_user_from_token
from app.modules.common import get_db_session, MessageType
from app.modules.job_outro.models import JobOutroTemplate
from app.modules.job_outro.types import (
    JobOutroTemplateType,
    JobOutroTemplateInput,
    JobOutroTemplateResponse,
)


# ============ Query Resolvers ============

def get_job_outro_templates(info: Info, active_only: bool = False) -> List[JobOutroTemplateType]:
    """Get all job outro templates for the current company"""
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
        query = db.query(JobOutroTemplate).filter(
            JobOutroTemplate.company_id == company_id
        )
        
        if active_only:
            query = query.filter(JobOutroTemplate.is_active == True)
            
        templates = query.order_by(JobOutroTemplate.created_at.desc()).all()
        
        return [
            JobOutroTemplateType(
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

async def create_job_outro_template(info: Info, input: JobOutroTemplateInput) -> JobOutroTemplateResponse:
    """Create a new job outro template"""
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
        
        template = JobOutroTemplate(
            company_id=company_id,
            created_by=current.id,
            name=input.name,
            content=input.content,
            is_active=input.is_active,
        )
        db.add(template)
        db.commit()
        db.refresh(template)
        
        return JobOutroTemplateResponse(
            success=True,
            message="Job outro template created",
            template=JobOutroTemplateType(
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
        return JobOutroTemplateResponse(success=False, message=str(e), template=None)
    finally:
        db.close()


async def update_job_outro_template(info: Info, id: str, input: JobOutroTemplateInput) -> JobOutroTemplateResponse:
    """Update a job outro template"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    
    db = get_db_session()
    try:
        template = db.query(JobOutroTemplate).filter(JobOutroTemplate.id == id).first()
        if not template:
            return JobOutroTemplateResponse(success=False, message="Template not found", template=None)
        
        template.name = input.name
        template.content = input.content
        template.is_active = input.is_active
        db.commit()
        db.refresh(template)
        
        return JobOutroTemplateResponse(
            success=True,
            message="Job outro template updated",
            template=JobOutroTemplateType(
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
        return JobOutroTemplateResponse(success=False, message=str(e), template=None)
    finally:
        db.close()


async def delete_job_outro_template(info: Info, id: str) -> MessageType:
    """Delete a job outro template"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    
    db = get_db_session()
    try:
        template = db.query(JobOutroTemplate).filter(JobOutroTemplate.id == id).first()
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


async def toggle_job_outro_template(info: Info, id: str) -> JobOutroTemplateResponse:
    """Toggle job outro template active status"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    
    db = get_db_session()
    try:
        template = db.query(JobOutroTemplate).filter(JobOutroTemplate.id == id).first()
        if not template:
            return JobOutroTemplateResponse(success=False, message="Template not found", template=None)
        
        template.is_active = not template.is_active
        db.commit()
        db.refresh(template)
        
        return JobOutroTemplateResponse(
            success=True,
            message=f"Template {'activated' if template.is_active else 'deactivated'}",
            template=JobOutroTemplateType(
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
        return JobOutroTemplateResponse(success=False, message=str(e), template=None)
    finally:
        db.close()

