"""Submissions API endpoints for creating drafts, listing, and managing revisions."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_role
from app.core.database import get_db, set_tenant_context
from app.models.check import CheckRun
from app.models.submission import Submission, SubmissionVersion
from app.models.workspace import User
from app.schemas.submission import (
    CheckRunResponse,
    CreateSubmissionRequest,
    CreateVersionRequest,
    FindingResponse,
    SubmissionListResponse,
    SubmissionResponse,
    SubmissionVersionResponse,
)
from app.services.normalizer import normalize_text
from app.services.pipeline_runner import run_check_pipeline

router = APIRouter(prefix="/submissions", tags=["Submissions"])


def _format_check_run_response(cr: CheckRun) -> CheckRunResponse:
    """Helper converting CheckRun ORM instance with findings to Pydantic response."""
    return CheckRunResponse(
        id=str(cr.id),
        submission_id=str(cr.submission_id),
        submission_version_id=str(cr.submission_version_id),
        policy_version_id=str(cr.policy_version_id),
        status=cr.status,
        total_findings=cr.total_findings,
        total_overrides=cr.total_overrides,
        started_at=cr.started_at,
        completed_at=cr.completed_at,
        findings=[
            FindingResponse(
                id=str(f.id),
                rule_code=f.rule_code,
                category=f.category,
                severity=f.severity,
                title=f.title,
                matched_text=f.matched_text,
                start_offset=f.start_offset,
                end_offset=f.end_offset,
                suggested_fix=f.suggested_fix,
                receipt_a_draft_span=f.receipt_a_draft_span,
                receipt_b_rule_quote=f.receipt_b_rule_quote,
                source_document_title=f.source_document_title,
                source_section=f.source_section,
                status=f.status,
            )
            for f in cr.findings
        ],
    )



def _format_submission_response(sub: Submission) -> SubmissionResponse:
    """Helper converting Submission ORM instance to Pydantic response."""
    versions_sorted = sorted(sub.versions, key=lambda v: v.version_number)
    version_responses = [
        SubmissionVersionResponse(
            id=str(v.id),
            version_number=v.version_number,
            content=v.content,
            word_count=v.word_count,
            character_count=v.character_count,
            created_at=v.created_at,
        )
        for v in versions_sorted
    ]

    current_ver = next(
        (v for v in version_responses if v.version_number == sub.current_version_number),
        version_responses[-1] if version_responses else None,
    )

    return SubmissionResponse(
        id=str(sub.id),
        workspace_id=str(sub.workspace_id),
        creator_id=str(sub.creator_id),
        title=sub.title,
        channel=sub.channel,
        current_version_number=sub.current_version_number,
        status=sub.status,
        created_at=sub.created_at,
        current_version=current_ver,
        versions=version_responses,
    )


@router.post(
    "",
    response_model=SubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create content submission draft",
)
def create_submission(
    payload: CreateSubmissionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("creator", "reviewer", "brand_manager", "agency")),
):
    """
    Creates a new marketing draft submission and compiles version 1
    with normalized Unicode NFKC representation and bi-directional offset maps.
    """
    set_tenant_context(db, str(current_user.workspace_id))

    _normalized_content, offset_map = normalize_text(payload.content)
    words = len(payload.content.split())
    chars = len(payload.content)

    submission = Submission(
        workspace_id=current_user.workspace_id,
        creator_id=current_user.id,
        title=payload.title,
        channel=payload.channel,
        current_version_number=1,
        status="DRAFT",
    )
    db.add(submission)
    db.flush()

    sub_version = SubmissionVersion(
        workspace_id=current_user.workspace_id,
        submission_id=submission.id,
        version_number=1,
        content=payload.content,
        word_count=words,
        character_count=chars,
        offset_map=offset_map,
    )
    db.add(sub_version)
    db.commit()
    db.refresh(submission)

    return _format_submission_response(submission)


@router.get(
    "",
    response_model=SubmissionListResponse,
    summary="List workspace submissions",
)
def list_submissions(
    channel: str | None = Query(None, description="Filter by marketing channel"),
    status_filter: str | None = Query(None, alias="status", description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lists submissions belonging to the authenticated tenant workspace with pagination."""
    set_tenant_context(db, str(current_user.workspace_id))

    query = db.query(Submission).filter(Submission.workspace_id == current_user.workspace_id)
    if channel:
        query = query.filter(Submission.channel == channel)
    if status_filter:
        query = query.filter(Submission.status == status_filter)

    total = query.count()
    items = (
        query.order_by(Submission.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return SubmissionListResponse(
        items=[_format_submission_response(sub) for sub in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{submission_id}",
    response_model=SubmissionResponse,
    summary="Get submission details and revision history",
)
def get_submission(
    submission_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves full submission container, active version, and version history."""
    set_tenant_context(db, str(current_user.workspace_id))

    submission = (
        db.query(Submission)
        .filter(
            Submission.workspace_id == current_user.workspace_id,
            Submission.id == submission_id,
        )
        .first()
    )
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "SUBMISSION_NOT_FOUND",
                    "message": f"Submission with id {submission_id} not found in workspace",
                    "details": {"id": str(submission_id)},
                }
            },
        )

    return _format_submission_response(submission)


@router.post(
    "/{submission_id}/versions",
    response_model=SubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add revision to submission",
)
def create_submission_version(
    submission_id: uuid.UUID,
    payload: CreateVersionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("creator", "reviewer", "brand_manager")),
):
    """Appends an immutable revision version to an existing submission."""
    set_tenant_context(db, str(current_user.workspace_id))

    submission = (
        db.query(Submission)
        .filter(
            Submission.workspace_id == current_user.workspace_id,
            Submission.id == submission_id,
        )
        .first()
    )
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "SUBMISSION_NOT_FOUND",
                    "message": f"Submission with id {submission_id} not found in workspace",
                    "details": {"id": str(submission_id)},
                }
            },
        )

    new_version_number = submission.current_version_number + 1
    _normalized_content, offset_map = normalize_text(payload.content)
    words = len(payload.content.split())
    chars = len(payload.content)

    sub_version = SubmissionVersion(
        workspace_id=current_user.workspace_id,
        submission_id=submission.id,
        version_number=new_version_number,
        content=payload.content,
        word_count=words,
        character_count=chars,
        offset_map=offset_map,
    )
    submission.current_version_number = new_version_number
    db.add(sub_version)
    db.commit()
    db.refresh(submission)

    return _format_submission_response(submission)


@router.post(
    "/{submission_id}/check",
    response_model=CheckRunResponse,
    summary="Trigger compliance verification check pipeline",
)
def trigger_check(
    submission_id: uuid.UUID,
    version_number: int | None = Query(None, description="Target version number (defaults to latest)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("creator", "reviewer", "brand_manager")),
):
    """
    Executes synchronous verification pipeline across pre-flight prompt injection,
    deterministic forbidden terms, brand typos, and expired claims ledger.
    """
    set_tenant_context(db, str(current_user.workspace_id))
    try:
        check_run = run_check_pipeline(db, submission_id, version_number)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "CHECK_FAILED",
                    "message": str(e),
                    "details": {"submission_id": str(submission_id)},
                }
            },
        )

    return _format_check_run_response(check_run)


@router.get(
    "/{submission_id}/checks",
    response_model=list[CheckRunResponse],
    summary="List check runs for a submission",
)
def list_checks(
    submission_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lists historical check verification runs for a submission."""
    set_tenant_context(db, str(current_user.workspace_id))

    runs = (
        db.query(CheckRun)
        .filter(
            CheckRun.workspace_id == current_user.workspace_id,
            CheckRun.submission_id == submission_id,
        )
        .order_by(CheckRun.started_at.desc())
        .all()
    )
    return [_format_check_run_response(cr) for cr in runs]

