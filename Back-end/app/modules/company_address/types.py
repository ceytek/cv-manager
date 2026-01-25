"""
GraphQL Types for Company Address Module
Şirket Adresleri GraphQL Tipleri
"""
import strawberry
from typing import Optional, List


@strawberry.type
class CompanyAddressType:
    """Şirket Adresi GraphQL Type"""
    id: str
    name: str
    address: str
    google_maps_link: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    postal_code: Optional[str] = None
    is_default: bool = False
    is_active: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


@strawberry.input
class CompanyAddressInput:
    """Şirket Adresi oluşturma/güncelleme input"""
    name: str
    address: str
    google_maps_link: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    postal_code: Optional[str] = None
    is_default: Optional[bool] = False


@strawberry.input
class CompanyAddressUpdateInput:
    """Şirket Adresi güncelleme input"""
    id: str
    name: Optional[str] = None
    address: Optional[str] = None
    google_maps_link: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    postal_code: Optional[str] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None


@strawberry.type
class CompanyAddressResponse:
    """Mutation yanıtı"""
    success: bool
    message: str
    address: Optional[CompanyAddressType] = None
