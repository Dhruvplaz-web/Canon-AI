"""Pydantic schemas for brand governance intelligence, rule health, proposals, and backtesting."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class RuleHealthResponse(BaseModel):
    """Health metrics and diagnostic status for a compliance rule."""

    id: str
    rule_code: str
    snapshot_date: datetime
    total_evaluations: int
    total_flags: int
    total_overrides: int
    override_rate: float
    diagnostic_status: str
    primary_override_reason: str

    model_config = {"from_attributes": True}


class ProposalResponse(BaseModel):
    """Candidate policy change proposal (e.g. PROP-01)."""

    id: str
    proposal_code: str
    policy_version_id: str
    target_rule_code: str
    title: str
    rationale: str
    proposed_diff: dict[str, Any]
    status: str
    created_by: str
    adopted_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BacktestRunResponse(BaseModel):
    """Simulation run testing proposal impact across historical submissions."""

    id: str
    proposal_id: str
    status: str
    historical_submissions_analyzed: int
    prior_pass_rate: float
    simulated_pass_rate: float
    false_positives_eliminated: int
    regressions_detected: int
    safety_score: float
    recommendation: str
    started_at: datetime
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}


class AdoptProposalResponse(BaseModel):
    """Confirmation payload returned when a Brand Manager explicitly adopts a proposal into Policy v1.1."""

    proposal_id: str
    proposal_code: str
    new_policy_version_id: str
    version_number: str
    status: str
    approved_by: str
    approved_at: datetime
    message: str

    model_config = {"from_attributes": True}
