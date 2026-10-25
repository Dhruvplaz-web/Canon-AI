"""AuditLog, AIServiceCall, and Job ORM models."""

import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB

from app.core.database import Base
from app.models.base import GUID as UUID
from app.models.base import TimestampMixin, utcnow


class AuditLog(Base):
    """Immutable, append-only compliance audit trail. UPDATE and DELETE are revoked via DDL."""

    __tablename__ = "audit_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspace.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    actor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="SET NULL"),
        nullable=True,
    )
    action = Column(String(100), nullable=False)  # e.g. "POLICY_ADOPT_V1_1", "OVERRIDE_RECORDED"
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    previous_state = Column(JSONB, nullable=True)
    new_state = Column(JSONB, nullable=False, default=dict)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)


class AIServiceCall(Base):
    """AI transparency telemetry logging provider calls for the disclosure panel."""

    __tablename__ = "ai_service_call"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspace.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    check_run_id = Column(
        UUID(as_uuid=True),
        ForeignKey("check_run.id", ondelete="SET NULL"),
        nullable=True,
    )
    provider_name = Column(String(100), nullable=False)
    model_name = Column(String(100), nullable=False)
    prompt_tokens = Column(Integer, nullable=False, default=0)
    completion_tokens = Column(Integer, nullable=False, default=0)
    latency_ms = Column(Integer, nullable=False, default=0)
    payload_summary = Column(
        String(255), nullable=False
    )  # Structural summary only; zero document text or PII
    redacted_flag = Column(Boolean, nullable=False, default=False)
    retention_note = Column(
        String(255),
        nullable=False,
        default="Provider retention unverified in M1 (see VER-04)",
    )
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)


class Job(Base, TimestampMixin):
    """Asynchronous background pipeline job state tracking."""

    __tablename__ = "job"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspace.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    job_type = Column(
        String(50), nullable=False
    )  # Enum: CHECK_RUN, POLICY_COMPILE, BACKTEST_SIMULATION
    status = Column(
        String(50), nullable=False, default="QUEUED"
    )  # Enum: QUEUED, RUNNING, COMPLETED, PARTIAL, FAILED
    progress_percent = Column(Integer, nullable=False, default=0)
    error_message = Column(Text, nullable=True)
    heartbeat_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
