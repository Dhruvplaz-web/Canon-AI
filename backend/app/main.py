"""Canon — Pre-Publication Brand Governance Platform API Gateway."""

import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1 import auth, health
from app.core.config import settings

# Setup logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("canon.api")

app = FastAPI(
    title="Canon API",
    version="0.1.0",
    description="Pre-Publication Brand Governance Platform API Gateway",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS Middleware (Supports single-origin proxy & local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Standard Error Shape (Engineering Standards Section 5.5.3)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Formats validation errors into the standard error shape."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid request parameters or payload",
                "details": {"errors": exc.errors()},
            }
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Formats HTTP exceptions into the standard error shape."""
    detail = exc.detail
    if isinstance(detail, dict) and "error" in detail:
        return JSONResponse(status_code=exc.status_code, content=detail)

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": str(detail),
                "details": {},
            }
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catches unhandled errors and returns standard internal error shape without leaking internals."""
    logger.exception("Unhandled server error: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred",
                "details": {},
            }
        },
    )


# Routers
app.include_router(health.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")


@app.get("/", tags=["Root"])
def root():
    """Root entrypoint providing service info and links."""
    return {
        "service": "Canon Governance API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/api/v1/health/live",
    }
