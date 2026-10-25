"""Submission and SubmissionVersion ORM models."""

import uuid

from sqlalchemy import Column, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import GUID as UUID
from app.models.base import TimestampMixin


class Submission(Base, TimestampMixin):
    """Marketing draft container undergoing pre-publication brand check."""

    __tablename__ = "submission"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspace.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    creator_id = Column(
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="RESTRICT"),
        nullable=False,
    )
    title = Column(String(255), nullable=False)
    channel = Column(
        String(50), nullable=False, default="web_landing_page"
    )  # Enum: web_landing_page, email_blast, blog_post, ad_copy, press_release
    current_version_number = Column(Integer, nullable=False, default=1)
    status = Column(
        String(50), nullable=False, default="DRAFT"
    )  # Enum: DRAFT, QUEUED, CHECKING, COMPLETED, FAILED

    # Relationships
    versions = relationship(
        "SubmissionVersion", back_populates="submission", cascade="all, delete-orphan"
    )
    check_runs = relationship("CheckRun", back_populates="submission", cascade="all, delete-orphan")


class SubmissionVersion(Base, TimestampMixin):
    """Immutable text snapshot of a submission version."""

    __tablename__ = "submission_version"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspace.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    submission_id = Column(
        UUID(as_uuid=True),
        ForeignKey("submission.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version_number = Column(Integer, nullable=False, default=1)
    content = Column(Text, nullable=False)
    word_count = Column(Integer, nullable=False, default=0)
    character_count = Column(Integer, nullable=False, default=0)
    offset_map = Column(JSONB, nullable=False, default=list)

    __table_args__ = (
        UniqueConstraint("submission_id", "version_number", name="uq_submission_version"),
    )

    submission = relationship("Submission", back_populates="versions")
