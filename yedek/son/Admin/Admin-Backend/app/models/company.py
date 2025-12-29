from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Numeric, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func, text
import uuid
from app.database import Base

# Import existing models from main backend structure
class Company(Base):
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255))
    phone = Column(String(50))
    address = Column(String(500))
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name = Column(String(100), nullable=False)
    slug = Column(String(50), nullable=False)
    description = Column(String)
    cv_limit = Column(Integer)
    job_limit = Column(Integer)
    user_limit = Column(Integer)
    monthly_price = Column(Numeric(10, 2), nullable=False, default=0)
    yearly_price = Column(Numeric(10, 2), nullable=False, default=0)
    is_white_label = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))

class CompanySubscription(Base):
    __tablename__ = "company_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    company_id = Column(UUID(as_uuid=True), ForeignKey('companies.id'), nullable=False, index=True)
    plan_id = Column(UUID(as_uuid=True), ForeignKey('subscription_plans.id'), nullable=False)
    status = Column(String(20), nullable=False, server_default=text("'trial'"), index=True)
    start_date = Column(Date, nullable=False, server_default=text("CURRENT_DATE"))
    end_date = Column(Date)
    trial_end_date = Column(Date)
    auto_renew = Column(Boolean, nullable=False, default=True)
    billing_cycle = Column(String(20), default="monthly")
    last_billing_date = Column(Date)
    next_billing_date = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
