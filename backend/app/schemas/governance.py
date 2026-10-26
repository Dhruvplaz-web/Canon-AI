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
    model_config = {"from_attributes": True}


class RuleDetailResponse(BaseModel):
    """Detailed rule definition including source citation and suggestion."""

    id: str
    rule_code: str
    category: str
    severity: str
    title: str
    description: str | None = None
    pattern_or_term: str | None = None
    suggested_replacement: str | None = None
    source_citation: dict[str, Any] = {}
    is_active: bool

    model_config = {"from_attributes": True}


class ApprovedClaimResponse(BaseModel):
    """Temporal approved claim record with substantiation and validity dates."""

    id: str
    claim_code: str
    claim_text: str
    substantiation: str
    valid_from: datetime
    valid_until: datetime
    is_active: bool

    model_config = {"from_attributes": True}


class SourceDocumentResponse(BaseModel):
    """Source brand guideline document with cryptographic integrity hash."""

    id: str
    title: str
    document_type: str = "GUIDELINE"
    storage_path: str
    content_hash: str
    page_count: int
    extracted_text: str
    status: str

    model_config = {"from_attributes": True}


class ActivePolicyResponse(BaseModel):
    """Active policy version with compiled rules and temporal claims ledger."""

    id: str
    version_number: str
    status: str
    compiled_rules_count: int
    change_summary: str | None = None
    approved_by: str | None = None
    approved_at: datetime | None = None
    effective_date: datetime
    source_document: SourceDocumentResponse | None = None
    rules: list[RuleDetailResponse] = []
    approved_claims: list[ApprovedClaimResponse] = []

    model_config = {"from_attributes": True}


class BenchmarkMetrics(BaseModel):
    """Aggregate statistical metrics for the benchmark run."""

    true_positives: int
    true_negatives: int
    false_positives: int
    false_negatives: int
    precision: float
    recall: float
    f1_score: float
    accuracy: float
    adversarial_blocked_count: int
    adversarial_total: int
    adversarial_defense_rate: float
    avg_latency_ms: float
    p95_latency_ms: float


class BenchmarkCaseResult(BaseModel):
    """Execution trace for an individual benchmark test case."""

    id: str
    cohort: str
    title: str
    content: str
    expected_outcome: str
    expected_rule_code: str | None = None
    actual_outcome: str
    detected_rule_codes: list[str]
    findings_count: int
    is_correct: bool
    latency_ms: float
    findings: list[dict[str, Any]] = []


class BenchmarkRunResponse(BaseModel):
    """Full benchmark evaluation report payload."""

    timestamp: float
    policy_version: str
    total_cases: int
    metrics: BenchmarkMetrics
    cases: list[BenchmarkCaseResult]
