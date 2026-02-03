"""
GraphQL Types for Benefits Module
"""

import strawberry
from typing import Optional, List
from decimal import Decimal


@strawberry.type
class BenefitType:
    """GraphQL type for Benefit"""
    id: str
    name: str
    description: Optional[str] = None
    category: str
    value: Optional[float] = None
    value_period: Optional[str] = strawberry.field(name="valuePeriod", default=None)
    is_variable: bool = strawberry.field(name="isVariable", default=False)
    icon: Optional[str] = None
    is_active: bool = strawberry.field(name="isActive", default=True)
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)
    updated_at: Optional[str] = strawberry.field(name="updatedAt", default=None)


@strawberry.input
class BenefitInput:
    """Input type for creating/updating benefits"""
    name: str
    description: Optional[str] = None
    category: str  # BenefitCategory value
    value: Optional[float] = None
    value_period: Optional[str] = strawberry.field(name="valuePeriod", default="monthly")
    is_variable: bool = strawberry.field(name="isVariable", default=False)
    icon: Optional[str] = None
    is_active: bool = strawberry.field(name="isActive", default=True)


@strawberry.type
class BenefitResponseType:
    """Response type for benefit mutations"""
    success: bool
    message: str
    benefit: Optional[BenefitType] = None
