"""Pydantic schemas for reviewer decisions, overrides, and reason codes."""

from datetime import datetime

from pydantic import BaseModel, Field


class OverrideFindingRequest(BaseModel):
    """Payload for human reviewer override of a compliance finding."""

    reason_code: str = Field(
        ...,
        description="Mandatory taxonomy code explaining the override (e.g., SCOPE_MISMATCH).",
        min_length=2,
        max_length=50,
    )
    justification: str = Field(
        ...,
        description="Human justification text recorded into the immutable audit log.",
        min_length=5,
        max_length=2000,
    )
    decision_type: str = Field(
        default="OVERRIDE",
        description="Type of human decision (OVERRIDE, REJECT_DRAFT, REQUEST_EDITS, APPROVE_EXCEPTION).",
    )


class DecisionResponse(BaseModel):
    """Response representation for a recorded human compliance decision."""

    id: str
    finding_id: str
    reviewer_id: str
    decision_type: str
    reason_code: str
    justification: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ReasonCodeResponse(BaseModel):
    """Taxonomy reason code for reviewer overrides."""

    id: str
    code: str
    title: str
    description: str | None = None
    is_active: bool = True

    model_config = {"from_attributes": True}


class ReviewQueueItemResponse(BaseModel):
    """Aggregated finding item returned in the review triage queue with pushdown metadata."""

    id: str
    check_run_id: str
    submission_id: str
    submission_title: str
    submission_channel: str
    submission_status: str
    creator_id: str | None = None
    creator_name: str | None = None
    rule_code: str
    category: str
    severity: str
    title: str
    matched_text: str
    start_offset: int
    end_offset: int
    suggested_fix: str | None = None
    receipt_a_draft_span: str
    receipt_b_rule_quote: str
    source_document_title: str
    source_section: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewQueueResponse(BaseModel):
    """Paginated review queue response enforcing database pushdown (PROP-U08)."""

    items: list[ReviewQueueItemResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class BatchOverrideRequest(BaseModel):
    """Payload for batch human reviewer overrides with mandatory taxonomy reason code."""

    finding_ids: list[str] = Field(
        ...,
        min_length=1,
        max_length=100,
        description="List of finding IDs to override in batch.",
    )
    reason_code: str = Field(
        ...,
        min_length=2,
        max_length=50,
        description="Mandatory taxonomy reason code.",
    )
    justification: str = Field(
        ...,
        min_length=5,
        max_length=2000,
        description="Human justification recorded into the immutable audit log for each finding.",
    )
    decision_type: str = Field(
        default="OVERRIDE",
        description="Type of human decision.",
    )


class BatchOverrideResponse(BaseModel):
    """Summary of batch override operation."""

    overridden_count: int
    affected_finding_ids: list[str]
    reason_code: str
    justification: str
