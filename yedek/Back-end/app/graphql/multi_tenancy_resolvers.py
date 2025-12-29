"""
Multi-tenancy GraphQL Resolvers
Company, Subscription, Usage, and Billing resolvers
"""
import strawberry
from strawberry.types import Info
from typing import Optional, List
from uuid import UUID
from datetime import date
from sqlalchemy.orm import Session

from app.graphql.types import (
    CompanyType,
    SubscriptionPlanType,
    CompanySubscriptionType,
    UsageTrackingType,
    UsageLimitCheckType,
    UsageStatsType,
    TransactionType,
    SubscriptionStatusType,
    CreateCompanyInput,
    UpdateCompanyInput,
    CreateSubscriptionInput,
    ChangePlanInput,
    MessageType,
)
from app.services.company_service import CompanyService
from app.services.subscription_service import SubscriptionService
from app.services.usage_service import UsageService
from app.services.billing_service import BillingService
from app.models.subscription import ResourceType, SubscriptionPlan
from app.core.database import get_async_session
from app.api.dependencies import get_company_id_from_token


async def get_db_session():
    """Get async database session for GraphQL"""
    async for session in get_async_session():
        return session


async def get_company_id_from_context(info: Info) -> Optional[UUID]:
    """Extract company_id from JWT token in GraphQL context"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    
    if not auth_header:
        return None
    
    try:
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            return None
        
        return get_company_id_from_token(token)
    except (ValueError, AttributeError):
        return None


@strawberry.type
class CompanyQuery:
    """Company-related queries"""
    
    @strawberry.field
    async def company(self, info: Info, company_id: str) -> Optional[CompanyType]:
        """Get company by ID"""
        db = await get_db_session()
        try:
            company = await CompanyService.get_company_by_id(db, UUID(company_id))
            
            if not company:
                return None
            
            return CompanyType(
                id=str(company.id),
                company_code=company.company_code,
                name=company.name,
                subdomain=company.subdomain,
                custom_domain=company.custom_domain,
                logo_url=company.logo_url,
                theme_colors=company.theme_colors,
                email=company.email,
                phone=company.phone,
                is_active=company.is_active,
                created_at=company.created_at.isoformat(),
                updated_at=company.updated_at.isoformat() if company.updated_at else None
            )
        finally:
            await db.close()
    
    @strawberry.field
    async def company_by_code(self, info: Info, code: str) -> Optional[CompanyType]:
        """Get company by company code"""
        db = await get_db_session()
        try:
            company = await CompanyService.get_company_by_code(db, code)
            
            if not company:
                return None
            
            return CompanyType(
                id=str(company.id),
                company_code=company.company_code,
                name=company.name,
                subdomain=company.subdomain,
                custom_domain=company.custom_domain,
                logo_url=company.logo_url,
                theme_colors=company.theme_colors,
                email=company.email,
                phone=company.phone,
                is_active=company.is_active,
                created_at=company.created_at.isoformat(),
                updated_at=company.updated_at.isoformat() if company.updated_at else None
            )
        finally:
            await db.close()
    
    @strawberry.field
    async def my_company(self, info: Info) -> Optional[CompanyType]:
        """Get current user's company"""
        company_id = await get_company_id_from_context(info)
        
        if not company_id:
            return None
        
        db = await get_db_session()
        try:
            company = await CompanyService.get_company_by_id(db, company_id)
            
            if not company:
                return None
            
            return CompanyType(
                id=str(company.id),
                company_code=company.company_code,
                name=company.name,
                subdomain=company.subdomain,
                custom_domain=company.custom_domain,
                logo_url=company.logo_url,
                theme_colors=company.theme_colors,
                email=company.email,
                phone=company.phone,
                is_active=company.is_active,
                created_at=company.created_at.isoformat(),
                updated_at=company.updated_at.isoformat() if company.updated_at else None
            )
        finally:
            await db.close()
    
    @strawberry.field
    async def subscription_plans(self, info: Info) -> List[SubscriptionPlanType]:
        """List all active subscription plans"""
        db = await get_db_session()
        try:
            plans = await SubscriptionService.list_active_plans(db)
            
            return [
                SubscriptionPlanType(
                    id=str(plan.id),
                    slug=plan.slug,
                    name=plan.name,
                    description=plan.description,
                    cv_limit=plan.cv_limit,
                    job_limit=plan.job_limit,
                    user_limit=plan.user_limit,
                    monthly_price=float(plan.monthly_price),
                    yearly_price=float(plan.yearly_price),
                    features=plan.features,
                    is_white_label=plan.is_white_label,
                    is_active=plan.is_active,
                    display_order=plan.display_order
                )
                for plan in plans
            ]
        finally:
            await db.close()
    
    @strawberry.field
    async def my_subscription(self, info: Info) -> Optional[CompanySubscriptionType]:
        """Get current company's subscription"""
        company_id = await get_company_id_from_context(info)
        
        if not company_id:
            raise Exception("Company context required")
        
        db = await get_db_session()
        try:
            subscription = await SubscriptionService.get_company_subscription(db, company_id)
            
            if not subscription:
                return None
            
            # Get plan details
            plan = await SubscriptionService.get_plan_by_id(db, subscription.plan_id)
            
            plan_type = None
            if plan:
                plan_type = SubscriptionPlanType(
                    id=str(plan.id),
                    slug=plan.slug,
                    name=plan.name,
                    description=plan.description,
                    cv_limit=plan.cv_limit,
                    job_limit=plan.job_limit,
                    user_limit=plan.user_limit,
                    monthly_price=float(plan.monthly_price),
                    yearly_price=float(plan.yearly_price),
                    features=plan.features,
                    is_white_label=plan.is_white_label,
                    is_active=plan.is_active,
                    display_order=plan.display_order
                )
            
            return CompanySubscriptionType(
                id=str(subscription.id),
                company_id=str(subscription.company_id),
                plan_id=str(subscription.plan_id),
                status=subscription.status.value,
                trial_end_date=subscription.trial_end_date.isoformat() if subscription.trial_end_date else None,
                start_date=subscription.start_date.isoformat(),
                end_date=subscription.end_date.isoformat() if subscription.end_date else None,
                billing_cycle=subscription.billing_cycle,
                next_billing_date=subscription.next_billing_date.isoformat() if subscription.next_billing_date else None,
                auto_renew=subscription.auto_renew,
                plan=plan_type
            )
        finally:
            await db.close()
    
    @strawberry.field
    async def subscription_status(self, info: Info) -> SubscriptionStatusType:
        """Get comprehensive subscription status"""
        company_id = await get_company_id_from_context(info)
        
        if not company_id:
            raise Exception("Company context required")
        
        db = await get_db_session()
        try:
            status = await SubscriptionService.check_subscription_status(db, company_id)
            
            return SubscriptionStatusType(
                has_subscription=status["has_subscription"],
                status=status.get("status"),
                is_active=status.get("is_active", False),
                is_trial=status.get("is_trial", False),
                is_trial_expired=status.get("is_trial_expired", False),
                trial_end_date=status.get("trial_end_date"),
                start_date=status.get("start_date"),
                next_billing_date=status.get("next_billing_date"),
                billing_cycle=status.get("billing_cycle"),
                auto_renew=status.get("auto_renew", True),
                plan=status.get("plan"),
                limits=status.get("limits"),
                features=status.get("features")
            )
        finally:
            await db.close()
    
    @strawberry.field
    async def usage_stats(self, info: Info) -> UsageStatsType:
        """Get all usage statistics for current company"""
        company_id = await get_company_id_from_context(info)
        
        if not company_id:
            raise Exception("Company context required")
        
        db = await get_db_session()
        try:
            stats = await UsageService.get_all_usage(db, company_id)
            
            def to_limit_check(data: dict) -> UsageLimitCheckType:
                return UsageLimitCheckType(
                    limit_reached=data["limit_reached"],
                    current_usage=data["current_usage"],
                    limit=data["limit"],
                    remaining=data["remaining"],
                    is_unlimited=data["is_unlimited"],
                    percentage_used=data.get("percentage_used")
                )
            
            return UsageStatsType(
                cv_upload=to_limit_check(stats.get("cv_upload", {})),
                job_post=to_limit_check(stats.get("job_post", {})),
                ai_analysis=to_limit_check(stats.get("ai_analysis", {})),
                user_account=to_limit_check(stats.get("user_account", {})),
                api_call=to_limit_check(stats.get("api_call", {}))
            )
        finally:
            await db.close()
    
    @strawberry.field
    async def my_transactions(
        self, 
        info: Info,
        skip: int = 0,
        limit: int = 50
    ) -> List[TransactionType]:
        """Get current company's transactions"""
        company_id = await get_company_id_from_context(info)
        
        if not company_id:
            raise Exception("Company context required")
        
        db = await get_db_session()
        try:
            transactions = await BillingService.get_company_transactions(
                db, company_id, skip=skip, limit=limit
            )
            
            return [
                TransactionType(
                    id=str(t.id),
                    company_id=str(t.company_id),
                    subscription_id=str(t.subscription_id) if t.subscription_id else None,
                    transaction_type=t.transaction_type,
                    amount=float(t.amount),
                    currency=t.currency,
                    payment_method=t.payment_method.value if t.payment_method else None,
                    status=t.status.value,
                    transaction_date=t.transaction_date.isoformat(),
                    completed_at=t.completed_at.isoformat() if t.completed_at else None,
                    invoice_number=t.invoice_number,
                    payment_reference=t.payment_reference,
                    description=t.description,
                    notes=t.notes
                )
                for t in transactions
            ]
        finally:
            await db.close()


@strawberry.type
class CompanyMutation:
    """Company-related mutations"""
    
    @strawberry.mutation
    async def create_company(
        self,
        info: Info,
        input: CreateCompanyInput
    ) -> CompanyType:
        """Create a new company (admin only)"""
        db = await get_db_session()
        try:
            company = await CompanyService.create_company(
                db=db,
                name=input.name,
                subdomain=input.subdomain,
                custom_domain=input.custom_domain,
                theme_colors=input.theme_colors,
                email=input.email,
                phone=input.phone,
                company_code=input.company_code
            )
            
            return CompanyType(
                id=str(company.id),
                company_code=company.company_code,
                name=company.name,
                subdomain=company.subdomain,
                custom_domain=company.custom_domain,
                logo_url=company.logo_url,
                theme_colors=company.theme_colors,
                email=company.email,
                phone=company.phone,
                is_active=company.is_active,
                created_at=company.created_at.isoformat(),
                updated_at=company.updated_at.isoformat() if company.updated_at else None
            )
        finally:
            await db.close()
    
    @strawberry.mutation
    async def update_company(
        self,
        info: Info,
        input: UpdateCompanyInput
    ) -> Optional[CompanyType]:
        """Update current company"""
        company_id = await get_company_id_from_context(info)
        
        if not company_id:
            raise Exception("Company context required")
        
        db = await get_db_session()
        try:
            # Build updates dict
            updates = {}
            if input.name is not None:
                updates["name"] = input.name
            if input.subdomain is not None:
                updates["subdomain"] = input.subdomain
            if input.custom_domain is not None:
                updates["custom_domain"] = input.custom_domain
            if input.logo_url is not None:
                updates["logo_url"] = input.logo_url
            if input.theme_colors is not None:
                updates["theme_colors"] = input.theme_colors
            if input.email is not None:
                updates["email"] = input.email
            if input.phone is not None:
                updates["phone"] = input.phone
            
            company = await CompanyService.update_company(db, company_id, **updates)
            
            if not company:
                return None
            
            return CompanyType(
                id=str(company.id),
                company_code=company.company_code,
                name=company.name,
                subdomain=company.subdomain,
                custom_domain=company.custom_domain,
                logo_url=company.logo_url,
                theme_colors=company.theme_colors,
                email=company.email,
                phone=company.phone,
                is_active=company.is_active,
                created_at=company.created_at.isoformat(),
                updated_at=company.updated_at.isoformat() if company.updated_at else None
            )
        finally:
            await db.close()
    
    @strawberry.mutation
    async def create_subscription(
        self,
        info: Info,
        input: CreateSubscriptionInput
    ) -> CompanySubscriptionType:
        """Create a subscription for a company (admin only)"""
        db = get_db_session()
        try:
            subscription = await SubscriptionService.create_subscription(
                db=db,
                company_id=UUID(input.company_id),
                plan_id=UUID(input.plan_id),
                billing_cycle=input.billing_cycle,
                with_trial=input.with_trial,
                trial_days=input.trial_days
            )
            
            # Get plan details
            plan = await SubscriptionService.get_plan_by_id(db, subscription.plan_id)
            
            plan_type = None
            if plan:
                plan_type = SubscriptionPlanType(
                    id=str(plan.id),
                    slug=plan.slug,
                    name=plan.name,
                    description=plan.description,
                    cv_limit=plan.cv_limit,
                    job_limit=plan.job_limit,
                    user_limit=plan.user_limit,
                    monthly_price=float(plan.monthly_price),
                    yearly_price=float(plan.yearly_price),
                    features=plan.features,
                    is_white_label=plan.is_white_label,
                    is_active=plan.is_active,
                    display_order=plan.display_order
                )
            
            return CompanySubscriptionType(
                id=str(subscription.id),
                company_id=str(subscription.company_id),
                plan_id=str(subscription.plan_id),
                status=subscription.status.value,
                trial_end_date=subscription.trial_end_date.isoformat() if subscription.trial_end_date else None,
                start_date=subscription.start_date.isoformat(),
                end_date=subscription.end_date.isoformat() if subscription.end_date else None,
                billing_cycle=subscription.billing_cycle,
                next_billing_date=subscription.next_billing_date.isoformat() if subscription.next_billing_date else None,
                auto_renew=subscription.auto_renew,
                plan=plan_type
            )
        finally:
            db.close()
    
    @strawberry.mutation
    async def change_subscription_plan(
        self,
        info: Info,
        input: ChangePlanInput
    ) -> CompanySubscriptionType:
        """Change subscription plan"""
        company_id = await get_company_id_from_context(info)
        
        if not company_id:
            raise Exception("Company context required")
        
        db = get_db_session()
        try:
            subscription = await SubscriptionService.change_plan(
                db=db,
                company_id=company_id,
                new_plan_id=UUID(input.new_plan_id),
                billing_cycle=input.billing_cycle
            )
            
            # Get plan details
            plan = await SubscriptionService.get_plan_by_id(db, subscription.plan_id)
            
            plan_type = None
            if plan:
                plan_type = SubscriptionPlanType(
                    id=str(plan.id),
                    slug=plan.slug,
                    name=plan.name,
                    description=plan.description,
                    cv_limit=plan.cv_limit,
                    job_limit=plan.job_limit,
                    user_limit=plan.user_limit,
                    monthly_price=float(plan.monthly_price),
                    yearly_price=float(plan.yearly_price),
                    features=plan.features,
                    is_white_label=plan.is_white_label,
                    is_active=plan.is_active,
                    display_order=plan.display_order
                )
            
            return CompanySubscriptionType(
                id=str(subscription.id),
                company_id=str(subscription.company_id),
                plan_id=str(subscription.plan_id),
                status=subscription.status.value,
                trial_end_date=subscription.trial_end_date.isoformat() if subscription.trial_end_date else None,
                start_date=subscription.start_date.isoformat(),
                end_date=subscription.end_date.isoformat() if subscription.end_date else None,
                billing_cycle=subscription.billing_cycle,
                next_billing_date=subscription.next_billing_date.isoformat() if subscription.next_billing_date else None,
                auto_renew=subscription.auto_renew,
                plan=plan_type
            )
        finally:
            db.close()
    
    @strawberry.mutation
    async def cancel_subscription(
        self,
        info: Info,
        immediate: bool = False
    ) -> MessageType:
        """Cancel subscription"""
        company_id = await get_company_id_from_context(info)
        
        if not company_id:
            raise Exception("Company context required")
        
        db = get_db_session()
        try:
            await SubscriptionService.cancel_subscription(
                db=db,
                company_id=company_id,
                immediate=immediate
            )
            
            message = "Abonelik iptal edildi" if immediate else "Abonelik otomatik yenileme kapatıldı"
            
            return MessageType(
                message=message,
                success=True
            )
        finally:
            db.close()
