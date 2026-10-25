"""Policy, Rule, SourceDocument, and ApprovedClaim ORM models."""

import uuid

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import GUID as UUID
from app.models.base import TimestampMixin, utcnow


class SourceDocument(Base, TimestampMixin):
    """Source brand guidelines and compliance documentation."""

    __tablename__ = "source_document"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspace.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(255), nullable=False)
    document_type = Column(
        String(50), nullable=False, default="GUIDELINE"
    )  # Enum: GUIDELINE, CLAIMS_LIST, TERMINOLOGY, ASSET_SPEC
    storage_path = Column(String(512), nullable=False)
    content_hash = Column(String(64), nullable=False)  # SHA-256
    page_count = Column(Integer, nullable=False, default=1)
    extracted_text = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="PARSED")
    uploaded_by = Column(
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="RESTRICT"),
        nullable=False,
    )

    __table_args__ = (UniqueConstraint("workspace_id", "content_hash", name="uq_source_doc_hash"),)


class PolicyVersion(Base, TimestampMixin):
    """Immutable snapshot release of active brand rules."""

    __tablename__ = "policy_version"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspace.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("source_document.id", ondelete="SET NULL"),
        nullable=True,
    )
    version_number = Column(String(20), nullable=False)  # e.g. "1.0", "1.1"
    status = Column(String(50), nullable=False, default="DRAFT")  # Enum: DRAFT, ACTIVE, ARCHIVED
    compiled_rules_count = Column(Integer, nullable=False, default=0)
    change_summary = Column(Text, nullable=True)
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="RESTRICT"),
        nullable=False,
    )
    approved_by = Column(
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="RESTRICT"),
        nullable=True,
    )
    approved_at = Column(DateTime(timezone=True), nullable=True)
    effective_date = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("workspace_id", "version_number", name="uq_policy_version"),
        CheckConstraint(
            "(status != 'ACTIVE') OR (approved_by IS NOT NULL)",
            name="chk_active_policy_must_be_human_approved",
        ),
    )

    # Relationships
    rules = relationship("Rule", back_populates="policy_version", cascade="all, delete-orphan")
    approved_claims = relationship(
        "ApprovedClaim", back_populates="policy_version", cascade="all, delete-orphan"
    )


class Rule(Base, TimestampMixin):
    """Executable compliance rule with stable rule_code across versions."""

    __tablename__ = "rule"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspace.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    policy_version_id = Column(
        UUID(as_uuid=True),
        ForeignKey("policy_version.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rule_code = Column(String(50), nullable=False, index=True)
    category = Column(
        String(50), nullable=False
    )  # Enum: TERMINOLOGY, CLAIM, TONE, ACCESSIBILITY, VISUAL
    severity = Column(String(50), nullable=False)  # Enum: CRITICAL, WARNING, INFO
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    pattern_or_term = Column(String(255), nullable=True)
    suggested_replacement = Column(String(512), nullable=True)
    source_citation = Column(JSONB, nullable=False, default=dict)
    is_active = Column(Boolean, nullable=False, default=True)

    __table_args__ = (
        UniqueConstraint("policy_version_id", "rule_code", name="uq_policy_rule_code"),
    )

    policy_version = relationship("PolicyVersion", back_populates="rules")


class ApprovedClaim(Base, TimestampMixin):
    """Verified factual claim with temporal validity windows (valid_from / valid_until)."""

    __tablename__ = "approved_claim"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspace.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    policy_version_id = Column(
        UUID(as_uuid=True),
        ForeignKey("policy_version.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    claim_code = Column(String(50), nullable=False, index=True)
    claim_text = Column(Text, nullable=False)
    substantiation = Column(Text, nullable=False)
    valid_from = Column(DateTime(timezone=True), nullable=False)
    valid_until = Column(
        DateTime(timezone=True), nullable=False
    )  # Expired claims trigger EXPIRED_CLAIM
    is_active = Column(Boolean, nullable=False, default=True)

    __table_args__ = (
        UniqueConstraint("policy_version_id", "claim_code", name="uq_policy_claim_code"),
    )

    policy_version = relationship("PolicyVersion", back_populates="approved_claims")
