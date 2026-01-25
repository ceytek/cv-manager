"""
GraphQL Resolvers for Second Interview Template Module
"""
from typing import List, Optional
from strawberry.types import Info

from app.api.dependencies import get_company_id_from_token, get_current_user_from_token
from app.modules.common import get_db_session, MessageType
from app.modules.second_interview_template.models import (
    SecondInterviewTemplate,
    SecondInterviewTemplateType as TemplateTypeEnum,
    ONLINE_TEMPLATE_VARIABLES,
    IN_PERSON_TEMPLATE_VARIABLES,
)
from app.modules.second_interview_template.types import (
    SecondInterviewTemplateType,
    SecondInterviewTemplateTypeEnum,
    SecondInterviewTemplateInput,
    SecondInterviewTemplateUpdateInput,
    SecondInterviewTemplateResponse,
    TemplateVariablesResponse,
    TemplateVariableType,
)


# ============ Query Resolvers ============

def get_second_interview_templates(
    info: Info,
    template_type: Optional[SecondInterviewTemplateTypeEnum] = None
) -> List[SecondInterviewTemplateType]:
    """Get all second interview templates for the current company, optionally filtered by type"""
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
        query = db.query(SecondInterviewTemplate).filter(
            SecondInterviewTemplate.company_id == company_id
        )
        
        # Filter by template type if provided
        if template_type:
            query = query.filter(
                SecondInterviewTemplate.template_type == TemplateTypeEnum(template_type.value)
            )
        
        templates = query.order_by(SecondInterviewTemplate.created_at.desc()).all()
        
        return [
            SecondInterviewTemplateType(
                id=str(t.id),
                name=t.name,
                template_type=SecondInterviewTemplateTypeEnum(t.template_type.value),
                subject=t.subject,
                body=t.body,
                language=t.language or "TR",
                is_active=t.is_active,
                is_default=t.is_default or False,
                created_at=t.created_at.isoformat() if t.created_at else None,
                updated_at=t.updated_at.isoformat() if t.updated_at else None,
            ) for t in templates
        ]
    finally:
        db.close()


def get_second_interview_template(info: Info, id: str) -> Optional[SecondInterviewTemplateType]:
    """Get a single second interview template by ID"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    
    db = get_db_session()
    try:
        template = db.query(SecondInterviewTemplate).filter(SecondInterviewTemplate.id == id).first()
        if not template:
            return None
        
        return SecondInterviewTemplateType(
            id=str(template.id),
            name=template.name,
            template_type=SecondInterviewTemplateTypeEnum(template.template_type.value),
            subject=template.subject,
            body=template.body,
            language=template.language or "TR",
            is_active=template.is_active,
            is_default=template.is_default or False,
            created_at=template.created_at.isoformat() if template.created_at else None,
            updated_at=template.updated_at.isoformat() if template.updated_at else None,
        )
    finally:
        db.close()


def get_second_interview_template_variables(info: Info) -> TemplateVariablesResponse:
    """Get available template variables for second interview templates"""
    # No auth required for this - it's just static data
    return TemplateVariablesResponse(
        online_variables=[
            TemplateVariableType(
                key=v['key'],
                label_tr=v['label_tr'],
                label_en=v['label_en']
            ) for v in ONLINE_TEMPLATE_VARIABLES
        ],
        in_person_variables=[
            TemplateVariableType(
                key=v['key'],
                label_tr=v['label_tr'],
                label_en=v['label_en']
            ) for v in IN_PERSON_TEMPLATE_VARIABLES
        ]
    )


# ============ Mutation Resolvers ============

async def create_second_interview_template(
    info: Info, 
    input: SecondInterviewTemplateInput
) -> SecondInterviewTemplateResponse:
    """Create a new second interview email template"""
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
        
        # If setting as default, unset other defaults of same type
        if input.is_default:
            db.query(SecondInterviewTemplate).filter(
                SecondInterviewTemplate.company_id == company_id,
                SecondInterviewTemplate.template_type == TemplateTypeEnum(input.template_type.value),
                SecondInterviewTemplate.is_default == True
            ).update({"is_default": False})
        
        template = SecondInterviewTemplate(
            company_id=company_id,
            created_by=str(current.id),
            name=input.name,
            template_type=TemplateTypeEnum(input.template_type.value),
            subject=input.subject,
            body=input.body,
            language=input.language or "TR",
            is_active=input.is_active if input.is_active is not None else True,
            is_default=input.is_default if input.is_default is not None else False,
        )
        db.add(template)
        db.commit()
        db.refresh(template)
        
        return SecondInterviewTemplateResponse(
            success=True,
            message="Second interview template created",
            template=SecondInterviewTemplateType(
                id=str(template.id),
                name=template.name,
                template_type=SecondInterviewTemplateTypeEnum(template.template_type.value),
                subject=template.subject,
                body=template.body,
                language=template.language,
                is_active=template.is_active,
                is_default=template.is_default,
                created_at=template.created_at.isoformat() if template.created_at else None,
                updated_at=None,
            ),
        )
    except Exception as e:
        db.rollback()
        return SecondInterviewTemplateResponse(success=False, message=str(e), template=None)
    finally:
        db.close()


async def update_second_interview_template(
    info: Info, 
    id: str, 
    input: SecondInterviewTemplateUpdateInput
) -> SecondInterviewTemplateResponse:
    """Update a second interview email template"""
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
        template = db.query(SecondInterviewTemplate).filter(
            SecondInterviewTemplate.id == id,
            SecondInterviewTemplate.company_id == company_id
        ).first()
        
        if not template:
            return SecondInterviewTemplateResponse(success=False, message="Template not found", template=None)
        
        # Update fields if provided
        if input.name is not None:
            template.name = input.name
        if input.template_type is not None:
            template.template_type = TemplateTypeEnum(input.template_type.value)
        if input.subject is not None:
            template.subject = input.subject
        if input.body is not None:
            template.body = input.body
        if input.language is not None:
            template.language = input.language
        if input.is_active is not None:
            template.is_active = input.is_active
        if input.is_default is not None:
            # If setting as default, unset other defaults of same type
            if input.is_default:
                db.query(SecondInterviewTemplate).filter(
                    SecondInterviewTemplate.company_id == company_id,
                    SecondInterviewTemplate.template_type == template.template_type,
                    SecondInterviewTemplate.is_default == True,
                    SecondInterviewTemplate.id != id
                ).update({"is_default": False})
            template.is_default = input.is_default
        
        db.commit()
        db.refresh(template)
        
        return SecondInterviewTemplateResponse(
            success=True,
            message="Template updated",
            template=SecondInterviewTemplateType(
                id=str(template.id),
                name=template.name,
                template_type=SecondInterviewTemplateTypeEnum(template.template_type.value),
                subject=template.subject,
                body=template.body,
                language=template.language,
                is_active=template.is_active,
                is_default=template.is_default,
                created_at=template.created_at.isoformat() if template.created_at else None,
                updated_at=template.updated_at.isoformat() if template.updated_at else None,
            ),
        )
    except Exception as e:
        db.rollback()
        return SecondInterviewTemplateResponse(success=False, message=str(e), template=None)
    finally:
        db.close()


async def delete_second_interview_template(info: Info, id: str) -> MessageType:
    """Delete a second interview template"""
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
        template = db.query(SecondInterviewTemplate).filter(
            SecondInterviewTemplate.id == id,
            SecondInterviewTemplate.company_id == company_id
        ).first()
        
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
