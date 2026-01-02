"""
History Module
Tracks all actions/events for candidates throughout the recruitment process.
Provides single source of truth for application status and timeline.
"""

# Models
from app.modules.history.models import (
    ActionType,
    ApplicationHistory,
    DEFAULT_ACTION_TYPES,
)

# Types
from app.modules.history.types import (
    ActionTypeType,
    ApplicationHistoryType,
    LastStatusType,
    CreateHistoryEntryInput,
    HistoryResponse,
    HistoryListResponse,
)

# Resolver helper functions (can be imported by other modules)
# Note: Full resolvers are NOT imported here to avoid circular imports


__all__ = [
    # Models
    "ActionType",
    "ApplicationHistory",
    "DEFAULT_ACTION_TYPES",
    # Types
    "ActionTypeType",
    "ApplicationHistoryType",
    "LastStatusType",
    "CreateHistoryEntryInput",
    "HistoryResponse",
    "HistoryListResponse",
]

