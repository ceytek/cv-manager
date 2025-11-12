from sqlalchemy import Column, String
import uuid
from app.core.database import Base


class Role(Base):
    __tablename__ = "roles"
    # Store UUID as 36-char string for cross-dialect compatibility
    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(50), unique=True, nullable=False, index=True)

    def __repr__(self):
        return f"<Role(id={self.id}, name={self.name})>"
