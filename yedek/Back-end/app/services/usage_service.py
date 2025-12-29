"""
Usage Service
Handles usage tracking and limit enforcement
"""
from typing import Optional, Dict, List
from uuid import UUID
from datetime import date, datetime
from functools import wraps
from sqlalchemy import select, and_, text, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.subscription import UsageTracking, ResourceType, CompanySubscription, SubscriptionPlan
from app.services.subscription_service import SubscriptionService


class UsageService:
    """Service for tracking and enforcing usage limits"""
    
    @staticmethod
    async def get_current_usage(
        db: AsyncSession,
        company_id: UUID,
        resource_type: ResourceType
    ) -> int:
        """
        Get current month's usage count for a resource
        Uses PostgreSQL function for efficiency
        """
        # Sum all session counts for current month
        today = date.today()
        period_start = date(today.year, today.month, 1)
        # period_end isn't needed for filtering; we use period_start >= month start
        result = await db.execute(
            select(func.coalesce(func.sum(UsageTracking.count), 0)).where(
                and_(
                    UsageTracking.company_id == company_id,
                    UsageTracking.resource_type == resource_type.value,
                    UsageTracking.period_start >= period_start
                )
            )
        )
        count = result.scalar() or 0
        return int(count)
    
    @staticmethod
    async def increment_usage(
        db: AsyncSession,
        company_id: UUID,
        resource_type: ResourceType,
        increment: int = 1
    ) -> int:
        """
        Increment usage count for a resource
        Uses PostgreSQL function for atomic operation
        
        Returns:
            New count after increment
        """
        # Backward-compatible: create a session row with given increment
        return await UsageService.create_session_usage(
            db=db,
            company_id=company_id,
            resource_type=resource_type,
            count=increment,
            metadata={"source": "increment_usage"}
        )

    @staticmethod
    async def create_session_usage(
        db: AsyncSession,
        company_id: UUID,
        resource_type: ResourceType,
        count: int,
        metadata: Optional[Dict] = None,
        batch_number: Optional[str] = None
    ) -> int:
        """
        Create a per-session usage record for the current month, keyed by batch_number.
        Returns the current month's total count after insertion.
        """
        print(f"🔍 create_session_usage called: count={count}, resource_type={resource_type.value}, batch_number={batch_number}")
        if count <= 0:
            print(f"⚠️ count={count} is <= 0, returning current usage")
            return await UsageService.get_current_usage(db, company_id, resource_type)
        today = date.today()
        month_start = date(today.year, today.month, 1)
        # Calculate real month end (last day of current month)
        if today.month == 12:
            month_end = date(today.year, 12, 31)
        else:
            from calendar import monthrange
            last_day = monthrange(today.year, today.month)[1]
            month_end = date(today.year, today.month, last_day)

        # Always insert a new session row (per batch)
        print(f"🆕 Creating session UsageTracking entry: count={int(count)}, batch_number={batch_number}, period_start={month_start}, period_end={month_end}")
        entry = UsageTracking(
            company_id=company_id,
            resource_type=resource_type.value,
            count=int(count),
            period_start=month_start,
            period_end=month_end,
            usage_metadata=metadata or {},
            batch_number=batch_number
        )
        db.add(entry)
        await db.commit()
        print(f"✅ UsageTracking session entry committed successfully")
        return await UsageService.get_current_usage(db, company_id, resource_type)
    
    @staticmethod
    async def get_usage_limit(
        db: AsyncSession,
        company_id: UUID,
        resource_type: ResourceType
    ) -> Optional[int]:
        """
        Get usage limit for a resource based on subscription plan
        
        Returns:
            Limit number or None (unlimited)
        """
        # Get company subscription
        subscription = await SubscriptionService.get_company_subscription(db, company_id)
        if not subscription:
            return 0  # No subscription = no access
        
        # Get plan
        plan = await SubscriptionService.get_plan_by_id(db, subscription.plan_id)
        if not plan:
            return 0
        
        # Map resource type to plan limit
        limit_map = {
            ResourceType.CV_UPLOAD: plan.cv_limit,
            ResourceType.JOB_POST: plan.job_limit,
            ResourceType.USER_ACCOUNT: plan.user_limit,
            ResourceType.AI_ANALYSIS: plan.cv_limit,  # Usually same as CV limit
            ResourceType.API_CALL: None  # Usually unlimited or separate tracking
        }
        
        return limit_map.get(resource_type)
    
    @staticmethod
    async def check_usage_limit(
        db: AsyncSession,
        company_id: UUID,
        resource_type: ResourceType
    ) -> Dict[str, any]:
        """
        Check if company has reached usage limit
        
        Returns:
            dict with limit_reached, current_usage, limit, remaining
        """
        current_usage = await UsageService.get_current_usage(db, company_id, resource_type)
        limit = await UsageService.get_usage_limit(db, company_id, resource_type)
        
        if limit is None:
            # Unlimited
            return {
                "limit_reached": False,
                "current_usage": current_usage,
                "limit": None,
                "remaining": None,
                "is_unlimited": True
            }
        
        limit_reached = current_usage >= limit
        remaining = max(0, limit - current_usage)
        
        return {
            "limit_reached": limit_reached,
            "current_usage": current_usage,
            "limit": limit,
            "remaining": remaining,
            "is_unlimited": False,
            "percentage_used": (current_usage / limit * 100) if limit > 0 else 0
        }
    
    @staticmethod
    async def can_use_resource(
        db: AsyncSession,
        company_id: UUID,
        resource_type: ResourceType
    ) -> bool:
        """
        Check if company can use a resource (hasn't reached limit)
        
        Returns:
            True if usage is allowed, False if limit reached
        """
        check = await UsageService.check_usage_limit(db, company_id, resource_type)
        return not check["limit_reached"]
    
    @staticmethod
    async def get_all_usage(
        db: AsyncSession,
        company_id: UUID
    ) -> Dict[str, Dict]:
        """
        Get usage statistics for all resources
        
        Returns:
            dict mapping resource types to usage info
        """
        usage_stats = {}
        
        for resource_type in ResourceType:
            usage_stats[resource_type.value] = await UsageService.check_usage_limit(
                db, company_id, resource_type
            )
        
        return usage_stats
    
    @staticmethod
    async def get_usage_history(
        db: AsyncSession,
        company_id: UUID,
        resource_type: Optional[ResourceType] = None,
        months: int = 6
    ) -> List[UsageTracking]:
        """
        Get usage history for last N months
        
        Args:
            db: Database session
            company_id: Company UUID
            resource_type: Optional filter by resource type
            months: Number of months to retrieve
        
        Returns:
            List of UsageTracking records
        """
        query = select(UsageTracking).where(
            UsageTracking.company_id == company_id
        )
        
        if resource_type:
            query = query.where(UsageTracking.resource_type == resource_type)
        
        query = query.order_by(UsageTracking.period_start.desc()).limit(months * 5)  # Approximate
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def reset_usage(
        db: AsyncSession,
        company_id: UUID,
        resource_type: Optional[ResourceType] = None
    ) -> int:
        """
        Reset usage counters (admin function)
        
        Args:
            db: Database session
            company_id: Company UUID
            resource_type: Optional - reset specific resource or all if None
        
        Returns:
            Number of records reset
        """
        today = date.today()
        period_start = date(today.year, today.month, 1)
        
        query = select(UsageTracking).where(
            and_(
                UsageTracking.company_id == company_id,
                UsageTracking.period_start == period_start
            )
        )
        
        if resource_type:
            query = query.where(UsageTracking.resource_type == resource_type)
        
        result = await db.execute(query)
        records = result.scalars().all()
        
        count = 0
        for record in records:
            record.count = 0
            count += 1
        
        if count > 0:
            await db.commit()
        
        return count


def require_usage_limit(resource_type: ResourceType):
    """
    Decorator to enforce usage limits on endpoints
    
    Usage:
        @require_usage_limit(ResourceType.CV_UPLOAD)
        async def upload_cv(db: AsyncSession, company_id: UUID, ...):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract db and company_id from args/kwargs
            db = kwargs.get('db') or (args[0] if len(args) > 0 else None)
            company_id = kwargs.get('company_id') or (args[1] if len(args) > 1 else None)
            
            if not db or not company_id:
                raise ValueError("Decorator requires 'db' and 'company_id' parameters")
            
            # Check if usage is allowed
            can_use = await UsageService.can_use_resource(db, company_id, resource_type)
            
            if not can_use:
                from fastapi import HTTPException
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": "usage_limit_reached",
                        "message": f"Usage limit reached for {resource_type.value}",
                        "resource_type": resource_type.value
                    }
                )
            
            # Execute the function
            result = await func(*args, **kwargs)
            
            # Record session usage of 1 after successful execution
            await UsageService.create_session_usage(db, company_id, resource_type, count=1, metadata={"source": "decorator"})
            
            return result
        
        return wrapper
    return decorator


class UsageLimitException(Exception):
    """Exception raised when usage limit is reached"""
    
    def __init__(self, resource_type: ResourceType, current_usage: int, limit: int):
        self.resource_type = resource_type
        self.current_usage = current_usage
        self.limit = limit
        super().__init__(
            f"Usage limit reached for {resource_type.value}: {current_usage}/{limit}"
        )
