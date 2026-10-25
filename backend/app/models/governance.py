"""Governance intelligence, rule health, proposals, and backtest ORM models."""

import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import GUID as UUID
from app.models.base import TimestampMixin, utcnow


class RuleHealthSnapshot(Base, TimestampMixin):
    """Aggregated historical override telemetry diagnosing rule health."""

    __tablename__ = "rule_health_snapshot"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspace.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rule_code = Column(String(50), nullable=False, index=True)
    snapshot_date = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    total_evaluations = Column(Integer, nullable=False, default=0)
    total_flags = Column(Integer, nullable=False, default=0)
    total_overrides = Column(Integer, nullable=False, default=0)
    override_rate = Column(Float, nullable=False, default=0.0)
    diagnostic_status = Column(
        String(50), nullable=False, default="HEALTHY"
    )  # Enum: HEALTHY, MONITOR, SCOPE_MISMATCH
    primary_override_reason = Column(String(50), nullable=False, default="NONE")


class RuleChangeProposal(Base, TimestampMixin):
    """Candidate rule modification synthesized from recurring reviewer overrides (e.g. PROP-01)."""

    __tablename__ = "rule_change_proposal"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspace.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    proposal_code = Column(String(50), nullable=False, index=True)  # e.g. "PROP-01"
    policy_version_id = Column(
        UUID(as_uuid=True),
        ForeignKey("policy_version.id", ondelete="CASCADE"),
        nullable=False,
    )
    target_rule_code = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    rationale = Column(Text, nullable=False)
    proposed_diff = Column(JSONB, nullable=False, default=dict)
    status = Column(
        String(50), nullable=False, default="DRAFT"
    )  # Enum: DRAFT, BACKTESTED, ADOPTED, REJECTED
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="RESTRICT"),
        nullable=False,
    )
    adopted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    backtest_runs = relationship(
        "BacktestRun", back_populates="proposal", cascade="all, delete-orphan"
    )


class BacktestRun(Base, TimestampMixin):
    """Simulation run testing a candidate proposal across historical submissions."""

    __tablename__ = "backtest_run"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspace.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    proposal_id = Column(
        UUID(as_uuid=True),
        ForeignKey("rule_change_proposal.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(
        String(50), nullable=False, default="RUNNING"
    )  # Enum: RUNNING, COMPLETED, FAILED
    historical_submissions_analyzed = Column(Integer, nullable=False, default=0)
    prior_pass_rate = Column(Float, nullable=False, default=0.0)
    simulated_pass_rate = Column(Float, nullable=False, default=0.0)
    false_positives_eliminated = Column(Integer, nullable=False, default=0)
    regressions_detected = Column(Integer, nullable=False, default=0)
    safety_score = Column(Float, nullable=False, default=1.0)
    recommendation = Column(String(50), nullable=False, default="SAFE_FOR_HUMAN_APPROVAL")
    started_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    proposal = relationship("RuleChangeProposal", back_populates="backtest_runs")
    results = relationship(
        "BacktestResult", back_populates="backtest_run", cascade="all, delete-orphan"
    )


class BacktestResult(Base, TimestampMixin):
    """Per-submission outcome during backtest simulation."""

    __tablename__ = "backtest_result"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspace.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    backtest_run_id = Column(
        UUID(as_uuid=True),
        ForeignKey("backtest_run.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    submission_id = Column(
        UUID(as_uuid=True),
        ForeignKey("submission.id", ondelete="CASCADE"),
        nullable=False,
    )
    original_status = Column(String(50), nullable=False)
    simulated_status = Column(String(50), nullable=False)
    finding_diff = Column(JSONB, nullable=False, default=dict)
    is_regression = Column(Boolean, nullable=False, default=False)

    backtest_run = relationship("BacktestRun", back_populates="results")
