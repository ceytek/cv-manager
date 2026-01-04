"""
Subscription Models
Subscription plans, company subscriptions, and usage tracking
"""
from sqlalchemy import Column, String, Integer, Numeric, Boolean, JSON, DateTime, Date, Enum, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.core.database import Base


class SubscriptionStatus(str, enum.Enum):
    """Subscription status enum"""
    TRIAL = "trial"
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    SUSPENDED = "suspended"


class ResourceType(str, enum.Enum):
    """Resource type enum for usage tracking"""
    CV_UPLOAD = "cv_upload"
    JOB_POST = "job_post"
    AI_ANALYSIS = "ai_analysis"
    USER_ACCOUNT = "user_account"
    API_CALL = "api_call"
    INTERVIEW_COMPLETED = "interview_completed"
    INTERVIEW_AI_ANALYSIS = "interview_ai_analysis"


class SubscriptionPlan(Base):
    """Subscription plan model"""
    __tablename__ = "subscription_plans"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    cv_limit = Column(Integer, nullable=True)  # null = unlimited
    job_limit = Column(Integer, nullable=True)  # null = unlimited
    user_limit = Column(Integer, nullable=True)  # null = unlimited
    monthly_price = Column(Numeric(10, 2), nullable=False, default=0)
    yearly_price = Column(Numeric(10, 2), nullable=False, default=0)
    features = Column(JSON, default={}, nullable=False)
    is_white_label = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<SubscriptionPlan {self.slug}: {self.name}>"


class CompanySubscription(Base):
    """Company subscription model - tracks active subscriptions"""
    __tablename__ = "company_subscriptions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey('companies.id', ondelete='CASCADE'), nullable=False)
    plan_id = Column(UUID(as_uuid=True), ForeignKey('subscription_plans.id', ondelete='RESTRICT'), nullable=False)
    status = Column(String(20), nullable=False, default='trial')  # Store as string to match PostgreSQL enum
    trial_end_date = Column(Date, nullable=True)
    start_date = Column(Date, nullable=False, default=func.current_date())
    end_date = Column(Date, nullable=True)
    billing_cycle = Column(String(20), nullable=False, default='monthly')  # 'monthly' or 'yearly'
    next_billing_date = Column(Date, nullable=True)
    auto_renew = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<CompanySubscription {self.company_id}: {self.status}>"


class UsageTracking(Base):
    """Usage tracking model - monthly usage limits"""
    __tablename__ = "usage_tracking"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey('companies.id', ondelete='CASCADE'), nullable=False)
    resource_type = Column(String(50), nullable=False)  # Store as string to match PostgreSQL enum
    count = Column(Integer, default=0, nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    # Map DB column 'metadata' to Python attribute 'usage_metadata' (avoid reserved name 'metadata')
    usage_metadata = Column('metadata', JSON, default={}, nullable=True)
    batch_number = Column(String(20), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        # Allow multiple session rows per month; enforce non-negative count
        CheckConstraint('count >= 0', name='check_positive_count'),
    )
    
    def __repr__(self):
        return f"<UsageTracking {self.company_id}: {self.resource_type} = {self.count}>"
