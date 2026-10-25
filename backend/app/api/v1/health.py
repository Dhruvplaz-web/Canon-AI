"""Health and readiness check endpoints."""

from fastapi import APIRouter, Response, status
from sqlalchemy import text

from app.core.config import settings

router = APIRouter(prefix="/health", tags=["System Health"])


@router.get("/live", summary="Liveness probe")
def health_live():
    """Liveness probe: verifies the FastAPI application process is up and responsive."""
    return {"status": "ok"}


@router.get("/ready", summary="Readiness probe")
def health_ready(response: Response):
    """
    Readiness probe: verifies database connectivity and core service readiness.
    Returns HTTP 200 when ready, HTTP 503 when degraded.
    """
    db_status = "unconfigured"
    is_ready = True

    try:
        # Lazy import of engine to prevent startup crash if database is temporarily unavailable
        from app.core.database import engine

        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception as exc:  # noqa: BLE001
        db_status = f"unavailable: {exc!s}"
        # In development/test mode without live DB, we report degraded status
        if settings.ENVIRONMENT != "development":
            is_ready = False
            response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "ok" if is_ready else "degraded",
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "llm_provider": settings.LLM_PROVIDER,
    }
