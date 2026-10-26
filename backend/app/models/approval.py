"""Approval, Dispute, and Comment ORM models for Milestone 1 Review Governance."""

import uuid

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    String,
    Text,
    event,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import GUID as UUID
from app.models.base import utcnow


class Approval(Base):
    """Formal human sign-off certificate (ENT-17). Immutable append-only record."""

    __tablename__ = "approval"

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
        index=True,
    )
    approved_by = Column(
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    decision = Column(String(50), nullable=False)  # APPROVED, SENT_BACK
    approval_type = Column(
        String(50), nullable=False, default="FINAL_SIGNOFF"
    )  # FINAL_SIGNOFF, REVIEWER_RECOMMENDATION
    notes = Column(Text, nullable=True)
    signed_off_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    approver = relationship("User", foreign_keys=[approved_by])
    submission = relationship("Submission", foreign_keys=[submission_id], backref="approvals")
    submission_version = relationship("SubmissionVersion", foreign_keys=[submission_version_id])

    __table_args__ = (
        CheckConstraint(
            "decision IN ('APPROVED', 'SENT_BACK') AND (decision != 'SENT_BACK' OR (notes IS NOT NULL AND length(trim(notes)) > 0))",
            name="chk_approval_decision_and_notes",
        ),
    )


class Dispute(Base):
    """Creator contest of a compliance finding (ENT-14). Requires standardized reason code."""

    __tablename__ = "dispute"

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
    creator_id = Column(
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    reason_code_id = Column(
        UUID(as_uuid=True),
        ForeignKey("reason_code.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    argument = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="OPEN")  # OPEN, RESOLVED, DISMISSED
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    reason = relationship("ReasonCode")


class Comment(Base):
    """Threaded collaboration note on a submission or finding (ENT-16)."""

    __tablename__ = "comment"

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
    finding_id = Column(
        UUID(as_uuid=True),
        ForeignKey("finding.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    author_id = Column(
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    comment_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )


# Enforce append-only immutability at the ORM layer across dialects (SQLite & PostgreSQL)
@event.listens_for(Approval, "before_update")
def block_approval_update(mapper, connection, target):
    raise IntegrityError(
        "UPDATE statement on 'approval' table prohibited: records are immutable sign-off certificates.",
        params=None,
        orig=Exception("approval is append-only"),
    )


@event.listens_for(Approval, "before_delete")
def block_approval_delete(mapper, connection, target):
    raise IntegrityError(
        "DELETE statement on 'approval' table prohibited: records are immutable sign-off certificates.",
        params=None,
        orig=Exception("approval cannot be deleted"),
    )


@event.listens_for(Dispute, "before_update")
def block_dispute_update(mapper, connection, target):
    raise IntegrityError(
        "UPDATE statement on 'dispute' table prohibited for application role: dispute entries are immutable.",
        params=None,
        orig=Exception("dispute is append-only"),
    )


@event.listens_for(Dispute, "before_delete")
def block_dispute_delete(mapper, connection, target):
    raise IntegrityError(
        "DELETE statement on 'dispute' table prohibited: dispute entries cannot be deleted.",
        params=None,
        orig=Exception("dispute cannot be deleted"),
    )
