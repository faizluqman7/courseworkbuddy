"""Coursework SQLAlchemy model for storing saved roadmaps."""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Coursework(Base):
    """Coursework model for storing user's saved roadmaps.
    
    The roadmap_data field stores the COMPLETE DecompositionResponse as JSON,
    including all tasks, milestones, guides, terminology, marking criteria, etc.
    """
    
    __tablename__ = "courseworks"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Quick-access fields for listing/filtering
    course_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="Untitled Coursework"
    )
    deadline: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )
    deadline_note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )
    
    # COMPLETE roadmap data as JSON - stores the ENTIRE DecompositionResponse
    # This includes: tasks, milestones, get_started_steps, terminology,
    # marking_criteria, prioritization_tiers, directory_structure,
    # constraints, debugging_tips, setup_instructions, key_deliverables, etc.
    roadmap_data: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationship to user
    user = relationship("User", back_populates="courseworks")
    
    def __repr__(self) -> str:
        return f"<Coursework {self.course_name} ({self.id})>"
