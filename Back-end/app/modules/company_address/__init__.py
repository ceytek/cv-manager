"""
Company Address Module
Şirket Adresleri Yönetimi
"""
from app.modules.company_address.models import CompanyAddress
from app.modules.company_address.types import (
    CompanyAddressType,
    CompanyAddressInput,
    CompanyAddressResponse,
)
from app.modules.company_address.resolvers import (
    get_company_addresses,
    get_company_address,
    create_company_address,
    update_company_address,
    delete_company_address,
)

__all__ = [
    # Models
    "CompanyAddress",
    # Types
    "CompanyAddressType",
    "CompanyAddressInput",
    "CompanyAddressResponse",
    # Resolvers
    "get_company_addresses",
    "get_company_address",
    "create_company_address",
    "update_company_address",
    "delete_company_address",
]
