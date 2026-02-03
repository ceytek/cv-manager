"""
Shortlist Models - Database models for shortlist sharing
"""

from sqlalchemy import Column, String, Integer, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import secrets

from app.core.database import Base


class ShortlistShare(Base):
    """
    ShortlistShare model - stores shared shortlist links for hiring managers.
    
    Attributes:
        id: Unique UUID identifier
        job_id: Foreign key to jobs table
        company_id: Foreign key to companies table
        token: Unique token for public access link
        title: Title for the shared shortlist
        message: Optional message for hiring manager
        expires_at: Link expiration timestamp
        created_by: User who created the share
        created_at: Record creation timestamp
        viewed_at: First view timestamp
        view_count: Number of times the link was viewed
        is_active: Whether the share is still active
    """
    
    __tablename__ = "shortlist_shares"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Share data
    token = Column(String(64), unique=True, nullable=False, index=True, default=lambda: secrets.token_urlsafe(32))
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    list_type = Column(String(20), nullable=False, default='shortlist', comment="Type of list: 'shortlist' or 'longlist'")
    
    # Expiration and access
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Tracking
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    viewed_at = Column(DateTime, nullable=True)
    view_count = Column(Integer, default=0, nullable=False)
    
    # Relationships
    job = relationship("Job", backref="shortlist_shares")
    creator = relationship("User", foreign_keys=[created_by])
    
    def __repr__(self):
        return f"<ShortlistShare {self.id}: {self.title}>"
    
    @property
    def is_expired(self) -> bool:
        """Check if the share link has expired."""
        if self.expires_at is None:
            return False
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_valid(self) -> bool:
        """Check if the share is valid (active and not expired)."""
        return self.is_active and not self.is_expired
