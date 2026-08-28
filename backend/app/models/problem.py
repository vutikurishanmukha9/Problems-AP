from datetime import datetime
from typing import List, Optional
from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Problem(Base):
    """Citizen reported problem entity with high-performance composite indexes."""
    __tablename__ = "problems"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    department: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    
    # Location attributes
    constituency: Mapped[Optional[str]] = mapped_column(String(120), index=True, nullable=True)
    district: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    area: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Status & anonymous metrics
    status: Mapped[str] = mapped_column(String(50), default="reported", index=True, nullable=False)
    confirmation_token: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    upvotes_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    
    # Timestamps
    reported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Composite indexes for scalable multi-dimensional querying
    __table_args__ = (
        Index("ix_problems_status_category", "status", "category"),
        Index("ix_problems_constituency_district", "constituency", "district"),
        Index("ix_problems_department_status", "department", "status"),
        Index("ix_problems_reported_at", "reported_at"),
    )

    # Relationships
    timeline: Mapped[List["ProblemTimeline"]] = relationship(
        "ProblemTimeline", back_populates="problem", cascade="all, delete-orphan", order_by="ProblemTimeline.timestamp"
    )
    evidence: Mapped[List["ProblemEvidence"]] = relationship(
        "ProblemEvidence", back_populates="problem", cascade="all, delete-orphan"
    )


class ProblemTimeline(Base):
    """Status log timeline for a citizen problem."""
    __tablename__ = "problem_timeline"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    problem_id: Mapped[str] = mapped_column(String(36), ForeignKey("problems.id", ondelete="CASCADE"), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    detail: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_timeline_problem_timestamp", "problem_id", "timestamp"),
    )

    problem: Mapped["Problem"] = relationship("Problem", back_populates="timeline")


class ProblemEvidence(Base):
    """Media evidence or image references attached to a problem."""
    __tablename__ = "problem_evidence"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    problem_id: Mapped[str] = mapped_column(String(36), ForeignKey("problems.id", ondelete="CASCADE"), index=True, nullable=False)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    problem: Mapped["Problem"] = relationship("Problem", back_populates="evidence")
