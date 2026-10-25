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
