"""
Subscription Service
Handles subscription management, plan changes, and status tracking
"""
from typing import Optional, List
from uuid import UUID
from datetime import date, timedelta
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.subscription import (
    SubscriptionPlan, 
    CompanySubscription, 
    SubscriptionStatus
)


class SubscriptionService:
    """Service for managing company subscriptions"""
    
    @staticmethod
    async def get_plan_by_slug(db: AsyncSession, slug: str) -> Optional[SubscriptionPlan]:
        """Get subscription plan by slug"""
        result = await db.execute(
            select(SubscriptionPlan).where(
                and_(
                    SubscriptionPlan.slug == slug,
                    SubscriptionPlan.is_active == True
                )
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_plan_by_id(db: AsyncSession, plan_id: UUID) -> Optional[SubscriptionPlan]:
        """Get subscription plan by ID"""
        result = await db.execute(
            select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_active_plans(db: AsyncSession) -> List[SubscriptionPlan]:
        """List all active subscription plans"""
        result = await db.execute(
            select(SubscriptionPlan)
            .where(SubscriptionPlan.is_active == True)
            .order_by(SubscriptionPlan.display_order, SubscriptionPlan.monthly_price)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def get_company_subscription(
        db: AsyncSession, 
        company_id: UUID,
        active_only: bool = True
    ) -> Optional[CompanySubscription]:
        """Get company's current subscription"""
        query = select(CompanySubscription).where(
            CompanySubscription.company_id == company_id
        )
        
        if active_only:
            query = query.where(
                CompanySubscription.status.in_([
                    SubscriptionStatus.ACTIVE,
                    SubscriptionStatus.TRIAL
                ])
            )
        
        query = query.order_by(CompanySubscription.created_at.desc())
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def create_subscription(
        db: AsyncSession,
        company_id: UUID,
        plan_id: UUID,
        billing_cycle: str = 'monthly',
        with_trial: bool = True,
        trial_days: int = 14
    ) -> CompanySubscription:
        """
        Create a new subscription for a company
        
        Args:
            db: Database session
            company_id: Company UUID
            plan_id: Subscription plan UUID
            billing_cycle: 'monthly' or 'yearly'
            with_trial: Whether to start with trial period
            trial_days: Number of trial days
        
        Returns:
            Created CompanySubscription object
        """
        # Check if company already has active subscription
        existing = await SubscriptionService.get_company_subscription(db, company_id)
        if existing:
            raise ValueError(f"Company already has an active subscription")
        
        # Validate plan exists
        plan = await SubscriptionService.get_plan_by_id(db, plan_id)
        if not plan:
            raise ValueError(f"Subscription plan not found: {plan_id}")
        
        today = date.today()
        
        # Set status and dates based on trial
        if with_trial:
            status = SubscriptionStatus.TRIAL
            trial_end_date = today + timedelta(days=trial_days)
            next_billing_date = trial_end_date
        else:
            status = SubscriptionStatus.ACTIVE
            trial_end_date = None
            # Calculate next billing date
            if billing_cycle == 'yearly':
                next_billing_date = today + timedelta(days=365)
            else:  # monthly
                next_billing_date = today + timedelta(days=30)
        
        subscription = CompanySubscription(
            company_id=company_id,
            plan_id=plan_id,
            status=status,
            trial_end_date=trial_end_date,
            start_date=today,
            billing_cycle=billing_cycle,
            next_billing_date=next_billing_date,
            auto_renew=True
        )
        
        db.add(subscription)
        await db.commit()
        await db.refresh(subscription)
        
        return subscription
    
    @staticmethod
    async def activate_subscription(
        db: AsyncSession,
        subscription_id: UUID
    ) -> CompanySubscription:
        """Activate a trial or pending subscription"""
        result = await db.execute(
            select(CompanySubscription).where(CompanySubscription.id == subscription_id)
        )
        subscription = result.scalar_one_or_none()
        
        if not subscription:
            raise ValueError(f"Subscription not found: {subscription_id}")
        
        subscription.status = SubscriptionStatus.ACTIVE
        
        # If was trial, set next billing date
        if subscription.trial_end_date and not subscription.next_billing_date:
            if subscription.billing_cycle == 'yearly':
                subscription.next_billing_date = date.today() + timedelta(days=365)
            else:
                subscription.next_billing_date = date.today() + timedelta(days=30)
        
        await db.commit()
        await db.refresh(subscription)
        
        return subscription
    
    @staticmethod
    async def cancel_subscription(
        db: AsyncSession,
        company_id: UUID,
        immediate: bool = False
    ) -> CompanySubscription:
        """
        Cancel a company's subscription
        
        Args:
            db: Database session
            company_id: Company UUID
            immediate: If True, cancel immediately. If False, cancel at end of billing period
        
        Returns:
            Updated CompanySubscription
        """
        subscription = await SubscriptionService.get_company_subscription(db, company_id)
        if not subscription:
            raise ValueError(f"No active subscription found for company")
        
        if immediate:
            subscription.status = SubscriptionStatus.CANCELLED
            subscription.end_date = date.today()
        else:
            # Set to cancel at next billing date
            subscription.auto_renew = False
            # Status will be updated to CANCELLED by scheduled job at next_billing_date
        
        await db.commit()
        await db.refresh(subscription)
        
        return subscription
    
    @staticmethod
    async def suspend_subscription(
        db: AsyncSession,
        company_id: UUID
    ) -> CompanySubscription:
        """Suspend a subscription (e.g., for non-payment)"""
        subscription = await SubscriptionService.get_company_subscription(db, company_id)
        if not subscription:
            raise ValueError(f"No active subscription found for company")
        
        subscription.status = SubscriptionStatus.SUSPENDED
        
        await db.commit()
        await db.refresh(subscription)
        
        return subscription
    
    @staticmethod
    async def change_plan(
        db: AsyncSession,
        company_id: UUID,
        new_plan_id: UUID,
        billing_cycle: Optional[str] = None
    ) -> CompanySubscription:
        """
        Change subscription plan (upgrade or downgrade)
        
        Args:
            db: Database session
            company_id: Company UUID
            new_plan_id: New subscription plan UUID
            billing_cycle: Optional new billing cycle
        
        Returns:
            Updated CompanySubscription
        """
        subscription = await SubscriptionService.get_company_subscription(db, company_id)
        if not subscription:
            raise ValueError(f"No active subscription found for company")
        
        # Validate new plan
        new_plan = await SubscriptionService.get_plan_by_id(db, new_plan_id)
        if not new_plan:
            raise ValueError(f"Subscription plan not found: {new_plan_id}")
        
        # Update subscription
        subscription.plan_id = new_plan_id
        
        if billing_cycle:
            subscription.billing_cycle = billing_cycle
            # Recalculate next billing date
            if billing_cycle == 'yearly':
                subscription.next_billing_date = date.today() + timedelta(days=365)
            else:
                subscription.next_billing_date = date.today() + timedelta(days=30)
        
        await db.commit()
        await db.refresh(subscription)
        
        return subscription
    
    @staticmethod
    async def check_subscription_status(
        db: AsyncSession,
        company_id: UUID
    ) -> dict:
        """
        Check subscription status and limits
        
        Returns:
            dict with subscription details, limits, and status
        """
        subscription = await SubscriptionService.get_company_subscription(db, company_id)
        
        if not subscription:
            return {
                "has_subscription": False,
                "status": None,
                "plan": None,
                "limits": None
            }
        
        # Get plan details
        plan = await SubscriptionService.get_plan_by_id(db, subscription.plan_id)
        
        # Check if trial expired
        is_trial_expired = False
        if subscription.status == SubscriptionStatus.TRIAL and subscription.trial_end_date:
            is_trial_expired = date.today() > subscription.trial_end_date
        
        return {
            "has_subscription": True,
            "status": subscription.status.value,
            "is_active": subscription.status in [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL],
            "is_trial": subscription.status == SubscriptionStatus.TRIAL,
            "is_trial_expired": is_trial_expired,
            "trial_end_date": subscription.trial_end_date.isoformat() if subscription.trial_end_date else None,
            "start_date": subscription.start_date.isoformat() if subscription.start_date else None,
            "next_billing_date": subscription.next_billing_date.isoformat() if subscription.next_billing_date else None,
            "billing_cycle": subscription.billing_cycle,
            "auto_renew": subscription.auto_renew,
            "plan": {
                "id": str(plan.id),
                "name": plan.name,
                "slug": plan.slug,
                "is_white_label": plan.is_white_label
            },
            "limits": {
                "cv_limit": plan.cv_limit,
                "job_limit": plan.job_limit,
                "user_limit": plan.user_limit
            },
            "features": plan.features
        }
    
    @staticmethod
    async def process_trial_expirations(db: AsyncSession) -> int:
        """
        Process expired trials (to be run by scheduled job)
        
        Returns:
            Number of subscriptions updated
        """
        today = date.today()
        
        # Find expired trials
        result = await db.execute(
            select(CompanySubscription).where(
                and_(
                    CompanySubscription.status == SubscriptionStatus.TRIAL,
                    CompanySubscription.trial_end_date < today
                )
            )
        )
        expired_trials = result.scalars().all()
        
        count = 0
        for subscription in expired_trials:
            subscription.status = SubscriptionStatus.EXPIRED
            subscription.end_date = subscription.trial_end_date
            count += 1
        
        if count > 0:
            await db.commit()
        
        return count
    
    @staticmethod
    async def process_renewals(db: AsyncSession) -> int:
        """
        Process subscription renewals (to be run by scheduled job)
        
        Returns:
            Number of subscriptions processed
        """
        today = date.today()
        
        # Find subscriptions due for renewal
        result = await db.execute(
            select(CompanySubscription).where(
                and_(
                    CompanySubscription.status == SubscriptionStatus.ACTIVE,
                    CompanySubscription.auto_renew == True,
                    CompanySubscription.next_billing_date <= today
                )
            )
        )
        due_renewals = result.scalars().all()
        
        count = 0
        for subscription in due_renewals:
            # Update next billing date
            if subscription.billing_cycle == 'yearly':
                subscription.next_billing_date = today + timedelta(days=365)
            else:
                subscription.next_billing_date = today + timedelta(days=30)
            
            count += 1
            
            # Note: Actual payment processing should be handled by billing service
        
        if count > 0:
            await db.commit()
        
        return count
