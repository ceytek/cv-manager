"""
GraphQL Resolvers for Benefits Module
"""

from typing import List, Optional
from uuid import UUID
from strawberry.types import Info

from app.modules.common import get_db_session
from app.api.dependencies import get_current_user_from_token, get_company_id_from_token
from .models import Benefit
from .types import BenefitType, BenefitInput, BenefitResponseType
from .enums import BenefitCategory, ValuePeriod


def _get_auth_info(info: Info):
    """Helper to get authentication info from request"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    
    if not auth_header:
        raise Exception("Not authenticated")
    
    try:
        scheme, token = auth_header.split()
    except ValueError:
        raise Exception("Invalid authorization header")
    
    return token


def _benefit_to_type(benefit: Benefit) -> BenefitType:
    """Convert Benefit model to BenefitType"""
    return BenefitType(
        id=str(benefit.id),
        name=benefit.name,
        description=benefit.description,
        category=benefit.category.value if benefit.category else "financial",
        value=float(benefit.value) if benefit.value else None,
        value_period=benefit.value_period.value if benefit.value_period else "monthly",
        is_variable=benefit.is_variable,
        icon=benefit.icon,
        is_active=benefit.is_active,
        created_at=benefit.created_at.isoformat() if benefit.created_at else None,
        updated_at=benefit.updated_at.isoformat() if benefit.updated_at else None
    )


def get_benefits(info: Info, category: Optional[str] = None, is_active: Optional[bool] = None) -> List[BenefitType]:
    """Get all benefits for the company"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        query = db.query(Benefit).filter(Benefit.company_id == company_id)
        
        # Filter by category if provided
        if category:
            try:
                cat_enum = BenefitCategory(category)
                query = query.filter(Benefit.category == cat_enum)
            except ValueError:
                pass
        
        # Filter by active status if provided
        if is_active is not None:
            query = query.filter(Benefit.is_active == is_active)
        
        # Order by category and name
        query = query.order_by(Benefit.category, Benefit.name)
        
        benefits = query.all()
        return [_benefit_to_type(b) for b in benefits]
    finally:
        db.close()


def get_benefit(info: Info, id: str) -> Optional[BenefitType]:
    """Get a single benefit by ID"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        benefit = db.query(Benefit).filter(
            Benefit.id == id,
            Benefit.company_id == company_id
        ).first()
        
        if not benefit:
            return None
        
        return _benefit_to_type(benefit)
    finally:
        db.close()


def create_benefit(info: Info, input: BenefitInput) -> BenefitResponseType:
    """Create a new benefit"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        # Validate category
        try:
            category = BenefitCategory(input.category)
        except ValueError:
            return BenefitResponseType(
                success=False,
                message=f"Invalid category: {input.category}",
                benefit=None
            )
        
        # Validate value period
        value_period = None
        if input.value_period:
            try:
                value_period = ValuePeriod(input.value_period)
            except ValueError:
                value_period = ValuePeriod.MONTHLY
        
        # Create benefit
        benefit = Benefit(
            company_id=company_id,
            name=input.name,
            description=input.description,
            category=category,
            value=input.value if not input.is_variable else None,
            value_period=value_period,
            is_variable=input.is_variable,
            icon=input.icon,
            is_active=input.is_active
        )
        
        db.add(benefit)
        db.commit()
        db.refresh(benefit)
        
        return BenefitResponseType(
            success=True,
            message="Benefit created successfully",
            benefit=_benefit_to_type(benefit)
        )
    except Exception as e:
        db.rollback()
        return BenefitResponseType(
            success=False,
            message=str(e),
            benefit=None
        )
    finally:
        db.close()


def update_benefit(info: Info, id: str, input: BenefitInput) -> BenefitResponseType:
    """Update an existing benefit"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        benefit = db.query(Benefit).filter(
            Benefit.id == id,
            Benefit.company_id == company_id
        ).first()
        
        if not benefit:
            return BenefitResponseType(
                success=False,
                message="Benefit not found",
                benefit=None
            )
        
        # Validate category
        try:
            category = BenefitCategory(input.category)
        except ValueError:
            return BenefitResponseType(
                success=False,
                message=f"Invalid category: {input.category}",
                benefit=None
            )
        
        # Validate value period
        value_period = benefit.value_period
        if input.value_period:
            try:
                value_period = ValuePeriod(input.value_period)
            except ValueError:
                pass
        
        # Update fields
        benefit.name = input.name
        benefit.description = input.description
        benefit.category = category
        benefit.value = input.value if not input.is_variable else None
        benefit.value_period = value_period
        benefit.is_variable = input.is_variable
        benefit.icon = input.icon
        benefit.is_active = input.is_active
        
        db.commit()
        db.refresh(benefit)
        
        return BenefitResponseType(
            success=True,
            message="Benefit updated successfully",
            benefit=_benefit_to_type(benefit)
        )
    except Exception as e:
        db.rollback()
        return BenefitResponseType(
            success=False,
            message=str(e),
            benefit=None
        )
    finally:
        db.close()


def delete_benefit(info: Info, id: str) -> BenefitResponseType:
    """Delete a benefit"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        benefit = db.query(Benefit).filter(
            Benefit.id == id,
            Benefit.company_id == company_id
        ).first()
        
        if not benefit:
            return BenefitResponseType(
                success=False,
                message="Benefit not found",
                benefit=None
            )
        
        db.delete(benefit)
        db.commit()
        
        return BenefitResponseType(
            success=True,
            message="Benefit deleted successfully",
            benefit=None
        )
    except Exception as e:
        db.rollback()
        return BenefitResponseType(
            success=False,
            message=str(e),
            benefit=None
        )
    finally:
        db.close()
