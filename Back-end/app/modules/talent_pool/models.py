"""
Talent Pool Models - Database models for talent pool management
"""
from sqlalchemy import Column, String, Boolean, Text, DateTime, ForeignKey, Index, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class TalentPoolTag(Base):
    """
    Tags for categorizing candidates in the talent pool.
    Can be system-defined (is_system=True) or custom per company.
    """
    __tablename__ = "talent_pool_tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=True, index=True)
    
    name = Column(String(100), nullable=False)
    color = Column(String(7), nullable=False, default="#6366f1")  # Hex color
    is_system = Column(Boolean, default=False)  # True for predefined system tags
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", backref="talent_pool_tags")
    candidate_tags = relationship("TalentPoolCandidateTag", back_populates="tag", cascade="all, delete-orphan")

    # Unique constraint: tag name should be unique per company (or globally for system tags)
    __table_args__ = (
        Index('ix_talent_pool_tags_company_name', 'company_id', 'name', unique=True),
    )

    def __repr__(self):
        return f"<TalentPoolTag(id={self.id}, name={self.name}, is_system={self.is_system})>"


class TalentPoolEntry(Base):
    """
    Represents a candidate added to the talent pool.
    A candidate can be in the pool once per company.
    """
    __tablename__ = "talent_pool_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign Keys
    candidate_id = Column(String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    added_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    source_job_id = Column(String(36), ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True)  # Which job they came from
    
    # Entry details
    notes = Column(Text, nullable=True)  # HR notes about the candidate
    status = Column(String(20), default="active")  # active, archived
    
    # Timestamps
    added_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    candidate = relationship("Candidate", backref="talent_pool_entries")
    company = relationship("Company", backref="talent_pool_entries")
    added_by_user = relationship("User", backref="added_talent_pool_entries")
    source_job = relationship("Job", backref="talent_pool_entries")
    tags = relationship("TalentPoolCandidateTag", back_populates="entry", cascade="all, delete-orphan")

    # Unique constraint: one entry per candidate per company
    __table_args__ = (
        Index('ix_talent_pool_entries_company_candidate', 'company_id', 'candidate_id', unique=True),
    )

    def __repr__(self):
        return f"<TalentPoolEntry(id={self.id}, candidate_id={self.candidate_id}, status={self.status})>"


class TalentPoolCandidateTag(Base):
    """
    Many-to-many relationship between talent pool entries and tags.
    """
    __tablename__ = "talent_pool_candidate_tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    entry_id = Column(UUID(as_uuid=True), ForeignKey("talent_pool_entries.id", ondelete="CASCADE"), nullable=False, index=True)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("talent_pool_tags.id", ondelete="CASCADE"), nullable=False, index=True)
    
    added_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    entry = relationship("TalentPoolEntry", back_populates="tags")
    tag = relationship("TalentPoolTag", back_populates="candidate_tags")

    # Unique constraint: one tag per entry
    __table_args__ = (
        Index('ix_talent_pool_candidate_tags_entry_tag', 'entry_id', 'tag_id', unique=True),
    )

    def __repr__(self):
        return f"<TalentPoolCandidateTag(entry_id={self.entry_id}, tag_id={self.tag_id})>"
