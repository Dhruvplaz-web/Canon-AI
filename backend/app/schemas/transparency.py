"""Pydantic schemas for AI transparency, disclosure, and telemetry."""

from datetime import datetime

from pydantic import BaseModel, Field


class AICallRecord(BaseModel):
    """Telemetry item for an individual downstream AI call."""

    id: str
    provider_name: str
    model_name: str
    prompt_tokens: int
    completion_tokens: int
    latency_ms: int
    payload_summary: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TransparencyDisclosureResponse(BaseModel):
    """Aggregate disclosure metrics for the public/enterprise transparency panel."""

    total_calls_24h: int
    primary_provider: str
    model_name: str
    prompt_tokens_24h: int
    completion_tokens_24h: int
    median_latency_ms: float
    redaction_mode: str = Field(
        default="OFF_IN_M1 (FR-14 declared not built)",
        description="Active text redaction status.",
    )
    retention_policy_note: str = Field(
        default="Provider retention unverified in M1 (see VER-04)",
        description="Disclosed data retention state.",
    )
    recent_calls: list[AICallRecord] = Field(default_factory=list)
