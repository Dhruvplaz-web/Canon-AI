"""AI Transparency, Provider Telemetry, and Disclosure Endpoints."""

import logging
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.core.config import settings
from app.core.database import get_db, set_tenant_context
from app.models.audit import AIServiceCall
from app.models.workspace import User
from app.schemas.transparency import AICallRecord, TransparencyDisclosureResponse

logger = logging.getLogger("canon.transparency")
router = APIRouter(prefix="/transparency", tags=["AI Transparency & Disclosure"])


@router.get(
    "/disclosure",
    response_model=TransparencyDisclosureResponse,
    summary="Get AI transparency telemetry and provider disclosure panel data",
)
def get_transparency_disclosure(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns aggregated AI provider telemetry for the disclosure panel (SCR-09).
    Accurately reports call counts, token utilization, latency, and explicitly
    declares that FR-14 redaction is not built and provider retention is unverified (VER-04).
    """
    set_tenant_context(db, str(current_user.workspace_id))

    since_24h = datetime.now(UTC) - timedelta(hours=24)
    calls = (
        db.query(AIServiceCall)
        .filter(
            AIServiceCall.workspace_id == current_user.workspace_id,
            AIServiceCall.created_at >= since_24h,
        )
        .order_by(AIServiceCall.created_at.desc())
        .all()
    )

    total_calls = len(calls)
    prompt_tokens = sum(c.prompt_tokens for c in calls)
    completion_tokens = sum(c.completion_tokens for c in calls)
    latencies = [c.latency_ms for c in calls]

    if latencies:
        sorted_lat = sorted(latencies)
        median_lat = float(sorted_lat[len(sorted_lat) // 2])
    else:
        median_lat = 0.0

    recent_records = [
        AICallRecord(
            id=str(c.id),
            provider_name=c.provider_name,
            model_name=c.model_name,
            prompt_tokens=c.prompt_tokens,
            completion_tokens=c.completion_tokens,
            latency_ms=c.latency_ms,
            payload_summary=c.payload_summary,
            created_at=c.created_at,
        )
        for c in calls[:10]
    ]

    primary_provider = calls[0].provider_name if calls else (settings.LLM_PROVIDER or "groq")
    model_name = calls[0].model_name if calls else (settings.LLM_MODEL or "llama-3.3-70b-versatile")

    return TransparencyDisclosureResponse(
        total_calls_24h=total_calls,
        primary_provider=primary_provider,
        model_name=model_name,
        prompt_tokens_24h=prompt_tokens,
        completion_tokens_24h=completion_tokens,
        median_latency_ms=median_lat,
        redaction_mode="OFF_IN_M1 (FR-14 declared not built)",
        retention_policy_note="Provider retention unverified in M1 (see VER-04)",
        recent_calls=recent_records,
    )
