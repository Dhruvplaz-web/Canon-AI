"""CheckRun, Finding, Decision, and ReasonCode ORM models."""

import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import GUID as UUID
from app.models.base import TimestampMixin, utcnow


class CheckRun(Base, TimestampMixin):
    """Pipeline verification instance pinning a specific submission version and policy."""

    __tablename__ = "check_run"

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
    submission_version_id = Column(
        UUID(as_uuid=True),
        ForeignKey("submission_version.id", ondelete="CASCADE"),
        nullable=False,
    )
    policy_version_id = Column(
        UUID(as_uuid=True),
        ForeignKey("policy_version.id", ondelete="RESTRICT"),
        nullable=False,
    )
    status = Column(
        String(50), nullable=False, default="RUNNING"
    )  # Enum: RUNNING, COMPLETED, PARTIAL, FAILED
    total_findings = Column(Integer, nullable=False, default=0)
    total_overrides = Column(Integer, nullable=False, default=0)
    started_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    submission = relationship("Submission", back_populates="check_runs")
    findings = relationship("Finding", back_populates="check_run", cascade="all, delete-orphan")


class Finding(Base, TimestampMixin):
    """Double-receipt violation card containing draft evidence and guideline citations."""

    __tablename__ = "finding"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspace.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    check_run_id = Column(
        UUID(as_uuid=True),
        ForeignKey("check_run.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rule_id = Column(
        UUID(as_uuid=True),
        ForeignKey("rule.id", ondelete="SET NULL"),
        nullable=True,
    )
    rule_code = Column(String(50), nullable=False, index=True)
    category = Column(String(50), nullable=False)
    severity = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    matched_text = Column(Text, nullable=False)
    start_offset = Column(Integer, nullable=False)
    end_offset = Column(Integer, nullable=False)
    suggested_fix = Column(Text, nullable=True)
    receipt_a_draft_span = Column(Text, nullable=False)  # Verbatim draft text
    receipt_b_rule_quote = Column(Text, nullable=False)  # Verbatim source policy text
    source_document_title = Column(String(255), nullable=False)
    source_section = Column(String(255), nullable=False)
    status = Column(
        String(50), nullable=False, default="PENDING_REVIEW"
    )  # Enum: PENDING_REVIEW, OVERRIDDEN, FIXED, CONFIRMED

    # Relationships
    check_run = relationship("CheckRun", back_populates="findings")
    decisions = relationship("Decision", back_populates="finding", cascade="all, delete-orphan")


class Decision(Base, TimestampMixin):
    """Human reviewer decision recording mandatory reason_code for overrides."""

    __tablename__ = "decision"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspace.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    finding_id = Column(
        UUID(as_uuid=True),
        ForeignKey("finding.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reviewer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="RESTRICT"),
        nullable=False,
    )
    decision_type = Column(
        String(50), nullable=False
    )  # Enum: OVERRIDE, REJECT_DRAFT, REQUEST_EDITS, APPROVE_EXCEPTION
    reason_code = Column(String(50), nullable=False)  # Mandatory reason code taxonomy
    justification = Column(Text, nullable=False)

    # Relationships
    finding = relationship("Finding", back_populates="decisions")


class ReasonCode(Base, TimestampMixin):
    """Standardized reason code taxonomy for reviewer overrides."""

    __tablename__ = "reason_code"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspace.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    code = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    __table_args__ = (UniqueConstraint("workspace_id", "code", name="uq_reason_code_workspace"),)
