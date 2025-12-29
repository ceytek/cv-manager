"""
Transaction Model
Payment and billing transactions
"""
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, CheckConstraint, Enum, Text
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base


class TransactionStatus(str, enum.Enum):
    """Transaction status enum"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class PaymentMethod(str, enum.Enum):
    """Payment method enum"""
    CREDIT_CARD = "credit_card"
    BANK_TRANSFER = "bank_transfer"
    PAYPAL = "paypal"
    STRIPE = "stripe"
    MANUAL = "manual"


class Transaction(Base):
    """Transaction model for billing and payments"""
    __tablename__ = "transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey('companies.id', ondelete='CASCADE'), nullable=False)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey('company_subscriptions.id', ondelete='SET NULL'), nullable=True)
    transaction_type = Column(String(50), nullable=False)  # 'subscription', 'upgrade', 'renewal', 'refund'
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), nullable=False, default='TRY')
    payment_method = Column(Enum(PaymentMethod), nullable=True)
    status = Column(Enum(TransactionStatus), nullable=False, default=TransactionStatus.PENDING)
    transaction_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    invoice_number = Column(String(50), unique=True, nullable=True)
    payment_reference = Column(String(255), nullable=True)  # External gateway reference
    description = Column(Text, nullable=True)
    transaction_metadata = Column(JSON, default={}, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), nullable=True)  # User who created the transaction
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        CheckConstraint('amount >= 0', name='check_positive_amount'),
    )
    
    def __repr__(self):
        return f"<Transaction {self.invoice_number or self.id}: {self.amount} {self.currency} - {self.status}>"
