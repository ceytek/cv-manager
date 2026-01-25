"""
GraphQL Resolvers for Company Address Module
Şirket Adresleri GraphQL Resolvers
"""
from typing import List, Optional
from strawberry.types import Info

from app.api.dependencies import get_company_id_from_token
from app.modules.common import get_db_session
from app.modules.company_address.models import CompanyAddress
from app.modules.company_address.types import (
    CompanyAddressType,
    CompanyAddressInput,
    CompanyAddressUpdateInput,
    CompanyAddressResponse,
)


def _get_auth_info(info: Info):
    """Helper to extract auth info from request"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    try:
        _, token = auth_header.split()
    except ValueError:
        raise Exception("Invalid authorization header")
    return token


def _build_address_type(address: CompanyAddress) -> CompanyAddressType:
    """Helper to build CompanyAddressType from model"""
    return CompanyAddressType(
        id=str(address.id),
        name=address.name,
        address=address.address,
        google_maps_link=address.google_maps_link,
        city=address.city,
        district=address.district,
        postal_code=address.postal_code,
        is_default=address.is_default,
        is_active=address.is_active,
        created_at=address.created_at.isoformat() if address.created_at else None,
        updated_at=address.updated_at.isoformat() if address.updated_at else None,
    )


# ============================================
# Query Resolvers
# ============================================

def get_company_addresses(info: Info, include_inactive: bool = False) -> List[CompanyAddressType]:
    """Get all addresses for the company"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        query = db.query(CompanyAddress).filter(
            CompanyAddress.company_id == company_id
        )
        
        if not include_inactive:
            query = query.filter(CompanyAddress.is_active == True)
        
        addresses = query.order_by(
            CompanyAddress.is_default.desc(),
            CompanyAddress.name
        ).all()
        
        return [_build_address_type(addr) for addr in addresses]
    finally:
        db.close()


def get_company_address(info: Info, id: str) -> Optional[CompanyAddressType]:
    """Get a single address by ID"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        address = db.query(CompanyAddress).filter(
            CompanyAddress.id == id,
            CompanyAddress.company_id == company_id
        ).first()
        
        if not address:
            return None
        
        return _build_address_type(address)
    finally:
        db.close()


# ============================================
# Mutation Resolvers
# ============================================

async def create_company_address(info: Info, input: CompanyAddressInput) -> CompanyAddressResponse:
    """Create a new company address"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        # If this is set as default, unset other defaults
        if input.is_default:
            db.query(CompanyAddress).filter(
                CompanyAddress.company_id == company_id,
                CompanyAddress.is_default == True
            ).update({"is_default": False})
        
        # Create new address
        address = CompanyAddress(
            company_id=company_id,
            name=input.name,
            address=input.address,
            google_maps_link=input.google_maps_link,
            city=input.city,
            district=input.district,
            postal_code=input.postal_code,
            is_default=input.is_default or False,
        )
        
        db.add(address)
        db.commit()
        db.refresh(address)
        
        return CompanyAddressResponse(
            success=True,
            message="Address created successfully",
            address=_build_address_type(address)
        )
        
    except Exception as e:
        db.rollback()
        return CompanyAddressResponse(
            success=False,
            message=f"Error creating address: {str(e)}"
        )
    finally:
        db.close()


async def update_company_address(info: Info, input: CompanyAddressUpdateInput) -> CompanyAddressResponse:
    """Update an existing company address"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        address = db.query(CompanyAddress).filter(
            CompanyAddress.id == input.id,
            CompanyAddress.company_id == company_id
        ).first()
        
        if not address:
            return CompanyAddressResponse(
                success=False,
                message="Address not found"
            )
        
        # If setting as default, unset other defaults
        if input.is_default:
            db.query(CompanyAddress).filter(
                CompanyAddress.company_id == company_id,
                CompanyAddress.is_default == True,
                CompanyAddress.id != input.id
            ).update({"is_default": False})
        
        # Update fields
        if input.name is not None:
            address.name = input.name
        if input.address is not None:
            address.address = input.address
        if input.google_maps_link is not None:
            address.google_maps_link = input.google_maps_link
        if input.city is not None:
            address.city = input.city
        if input.district is not None:
            address.district = input.district
        if input.postal_code is not None:
            address.postal_code = input.postal_code
        if input.is_default is not None:
            address.is_default = input.is_default
        if input.is_active is not None:
            address.is_active = input.is_active
        
        db.commit()
        db.refresh(address)
        
        return CompanyAddressResponse(
            success=True,
            message="Address updated successfully",
            address=_build_address_type(address)
        )
        
    except Exception as e:
        db.rollback()
        return CompanyAddressResponse(
            success=False,
            message=f"Error updating address: {str(e)}"
        )
    finally:
        db.close()


async def delete_company_address(info: Info, id: str) -> CompanyAddressResponse:
    """Delete a company address (soft delete - sets is_active to False)"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        address = db.query(CompanyAddress).filter(
            CompanyAddress.id == id,
            CompanyAddress.company_id == company_id
        ).first()
        
        if not address:
            return CompanyAddressResponse(
                success=False,
                message="Address not found"
            )
        
        # Soft delete
        address.is_active = False
        address.is_default = False  # Can't be default if inactive
        
        db.commit()
        
        return CompanyAddressResponse(
            success=True,
            message="Address deleted successfully"
        )
        
    except Exception as e:
        db.rollback()
        return CompanyAddressResponse(
            success=False,
            message=f"Error deleting address: {str(e)}"
        )
    finally:
        db.close()


# ============================================
# Export
# ============================================

__all__ = [
    "get_company_addresses",
    "get_company_address",
    "create_company_address",
    "update_company_address",
    "delete_company_address",
]
