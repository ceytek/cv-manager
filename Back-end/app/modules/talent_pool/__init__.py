"""
Talent Pool Module - Store and manage candidates for future opportunities

This module provides:
- TalentPoolEntry: Link candidates to the talent pool with notes
- TalentPoolTag: Custom and system tags for categorizing candidates
- TalentPoolCandidateTag: Many-to-many relationship between entries and tags

Import models directly from app.modules.talent_pool.models
Import types directly from app.modules.talent_pool.types
Import resolvers directly from app.modules.talent_pool.resolvers
"""

# Only export models here to avoid circular imports
# Types and resolvers should be imported directly from their files
from app.modules.talent_pool.models import (
    TalentPoolEntry,
    TalentPoolTag,
    TalentPoolCandidateTag,
)

__all__ = [
    "TalentPoolEntry",
    "TalentPoolTag",
    "TalentPoolCandidateTag",
]
