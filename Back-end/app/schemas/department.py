from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# Predefined color palette for departments
DEPARTMENT_COLORS = [
    "#3B82F6",  # Blue
    "#F97316",  # Orange
    "#EAB308",  # Yellow
    "#22C55E",  # Green
    "#8B5CF6",  # Purple
    "#EC4899",  # Pink
    "#14B8A6",  # Teal
    "#F43F5E",  # Rose
    "#6366F1",  # Indigo
    "#84CC16",  # Lime
]


# Request schemas
class DepartmentCreate(BaseModel):
    """Department creation schema"""
    name: str = Field(..., min_length=2, max_length=100)
    is_active: bool = True
    color: Optional[str] = Field(None, max_length=7, description="Hex color code like #3B82F6")


class DepartmentUpdate(BaseModel):
    """Department update schema"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    is_active: Optional[bool] = None
    color: Optional[str] = Field(None, max_length=7, description="Hex color code like #3B82F6")


# Response schemas
class DepartmentResponse(BaseModel):
    id: str
    name: str
    is_active: bool
    color: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
