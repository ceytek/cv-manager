import strawberry
from datetime import datetime, date
from typing import Optional, List
import uuid

@strawberry.type
class AdminUser:
    id: uuid.UUID
    username: str
    full_name: Optional[str]
    is_active: bool
    created_at: datetime

@strawberry.type
class LoginResponse:
    token: str
    admin_user: AdminUser

@strawberry.type
class SubscriptionPlan:
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str]
    cv_limit: Optional[int]
    job_limit: Optional[int]
    user_limit: Optional[int]
    monthly_price: float
    yearly_price: float
    is_active: bool
    sort_order: int

@strawberry.type
class CompanySubscriptionInfo:
    plan_name: str
    status: str
    start_date: date
    end_date: Optional[date]

@strawberry.type
class Company:
    id: uuid.UUID
    company_code: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    is_active: bool
    created_at: datetime
    subscription: Optional[CompanySubscriptionInfo]

@strawberry.type
class CompanyListResponse:
    companies: List[Company]
    total: int
    page: int
    page_size: int
    total_pages: int

@strawberry.type
class PlanSubscriber:
    company_id: uuid.UUID
    company_name: str
    company_code: str
    subscription_status: str
    start_date: date
    end_date: Optional[date]
    remaining_cv_quota: int
    remaining_job_quota: int
    remaining_user_quota: int

@strawberry.type
class PlanWithSubscriberCount:
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str]
    cv_limit: Optional[int]
    job_limit: Optional[int]
    user_limit: Optional[int]
    monthly_price: float
    yearly_price: float
    is_active: bool
    sort_order: int
    subscriber_count: int
