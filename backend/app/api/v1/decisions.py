"""Human Reviewer Decisions, Override Actions, and Reason Code Endpoints."""

import logging
import math
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_role
from app.core.database import get_db, set_tenant_context
from app.models.audit import AuditLog
from app.models.check import CheckRun, Decision, Finding, ReasonCode
from app.models.submission import Submission
from app.models.workspace import User
from app.schemas.decision import (
    BatchOverrideRequest,
    BatchOverrideResponse,
    DecisionResponse,
    OverrideFindingRequest,
    ReasonCodeResponse,
    ReviewQueueItemResponse,
    ReviewQueueResponse,
)

logger = logging.getLogger("canon.decisions")
router = APIRouter(tags=["Decisions & Reviewer Governance"])


@router.post(
    "/findings/{finding_id}/override",
    response_model=DecisionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record human reviewer override with mandatory reason code",
)
def override_finding(
    finding_id: uuid.UUID,
    payload: OverrideFindingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("reviewer", "brand_manager")),
):
    """
    Records a human reviewer override for a compliance finding.
    Enforces mandatory reason_code taxonomy, updates finding status to OVERRIDDEN,
    increments check_run override counter, and appends an immutable AuditLog entry.
    """
    set_tenant_context(db, str(current_user.workspace_id))

    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding or finding.workspace_id != current_user.workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "FINDING_NOT_FOUND",
                    "message": f"Finding with id {finding_id} was not found.",
                    "details": {"finding_id": str(finding_id)},
                }
            },
        )

    if finding.status == "OVERRIDDEN":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": {
                    "code": "ALREADY_OVERRIDDEN",
                    "message": "This finding has already been overridden.",
                    "details": {"finding_id": str(finding_id)},
                }
            },
        )

    # Validate reason code
    standard_codes = {
        "SCOPE_MISMATCH",
        "APPROVED_EXCEPTION",
        "FALSE_POSITIVE",
        "LEGAL_DIRECTIVE",
        "LEGACY_CONTENT",
    }
    db_reason = (
        db.query(ReasonCode)
        .filter(
            ReasonCode.workspace_id == current_user.workspace_id,
            ReasonCode.code == payload.reason_code,
            ReasonCode.is_active == True,
        )
        .first()
    )

    if not db_reason and payload.reason_code not in standard_codes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": {
                    "code": "INVALID_REASON_CODE",
                    "message": f"Reason code '{payload.reason_code}' is not recognized in the governance taxonomy.",
                    "details": {"allowed_codes": list(standard_codes)},
                }
            },
        )

    previous_status = finding.status

    # 1. Create Decision
    decision = Decision(
        workspace_id=current_user.workspace_id,
        finding_id=finding.id,
        reviewer_id=current_user.id,
        decision_type=payload.decision_type,
        reason_code=payload.reason_code,
        justification=payload.justification,
    )
    db.add(decision)
    db.flush()

    # 2. Update Finding Status
    finding.status = "OVERRIDDEN"

    # 3. Update CheckRun and Submission state if all findings resolved
    check_run = db.query(CheckRun).filter(CheckRun.id == finding.check_run_id).first()
    if check_run:
        check_run.total_overrides = (check_run.total_overrides or 0) + 1

        # Check if all findings for this check run are resolved
        all_findings = db.query(Finding).filter(Finding.check_run_id == check_run.id).all()
        all_resolved = all(f.status in ("OVERRIDDEN", "FIXED") for f in all_findings)
        if all_resolved:
            submission = db.query(Submission).filter(Submission.id == check_run.submission_id).first()
            if submission and submission.status != "APPROVED":
                submission.status = "APPROVED_WITH_OVERRIDE"

    # 4. Write immutable compliance AuditLog entry
    audit_entry = AuditLog(
        workspace_id=current_user.workspace_id,
        actor_id=current_user.id,
        action="FINDING_OVERRIDE",
        entity_type="FINDING",
        entity_id=finding.id,
        previous_state={"status": previous_status},
        new_state={
            "status": "OVERRIDDEN",
            "reason_code": payload.reason_code,
            "justification": payload.justification,
            "decision_id": str(decision.id),
        },
    )
    db.add(audit_entry)

    db.commit()
    db.refresh(decision)

    logger.info(
        "User %s overridden finding %s with reason %s.",
        current_user.id,
        finding_id,
        payload.reason_code,
    )

    return DecisionResponse(
        id=str(decision.id),
        finding_id=str(decision.finding_id),
        reviewer_id=str(decision.reviewer_id),
        decision_type=decision.decision_type,
        reason_code=decision.reason_code,
        justification=decision.justification,
        created_at=decision.created_at,
    )


@router.get(
    "/governance/reason-codes",
    response_model=list[ReasonCodeResponse],
    summary="List active override taxonomy reason codes",
)
def list_reason_codes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns active taxonomy reason codes for the authenticated workspace."""
    set_tenant_context(db, str(current_user.workspace_id))
    codes = (
        db.query(ReasonCode)
        .filter(
            ReasonCode.workspace_id == current_user.workspace_id,
            ReasonCode.is_active == True,
        )
        .order_by(ReasonCode.code)
        .all()
    )

    return [
        ReasonCodeResponse(
            id=str(rc.id),
            code=rc.code,
            title=rc.title,
            description=rc.description,
            is_active=rc.is_active,
        )
        for rc in codes
    ]


@router.get(
    "/review/queue",
    response_model=ReviewQueueResponse,
    summary="Review Queue Triage with pushdown filtering and pagination (PROP-U08)",
)
def get_review_queue(
    severity: str | None = Query(None, description="Filter by finding severity: CRITICAL, WARNING, INFO"),
    channel: str | None = Query(None, description="Filter by marketing channel"),
    status_filter: str | None = Query(None, alias="status", description="Filter by finding status"),
    rule_code: str | None = Query(None, description="Filter by rule code"),
    search: str | None = Query(None, description="Search draft title, matched text, or rule code"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    sort_by: str = Query("created_at", description="Sort field: created_at, severity, rule_code"),
    sort_order: str = Query("desc", description="Sort direction: asc, desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("reviewer", "brand_manager")),
):
    """
    Returns an aggregated, paginated list of compliance findings across submissions.
    Pushes down filtering by severity, channel, status, and search query directly to the database.
    Eliminates N+1 client waterfall queries.
    """
    set_tenant_context(db, str(current_user.workspace_id))

    query = (
        db.query(
            Finding,
            Submission.id.label("submission_id"),
            Submission.title.label("submission_title"),
            Submission.channel.label("submission_channel"),
            Submission.status.label("submission_status"),
            User.id.label("creator_id"),
            User.full_name.label("creator_name"),
        )
        .join(CheckRun, Finding.check_run_id == CheckRun.id)
        .join(Submission, CheckRun.submission_id == Submission.id)
        .outerjoin(User, Submission.creator_id == User.id)
        .filter(Finding.workspace_id == current_user.workspace_id)
    )

    if severity:
        query = query.filter(Finding.severity == severity)
    if channel:
        query = query.filter(Submission.channel == channel)
    if status_filter:
        query = query.filter(Finding.status == status_filter)
    if rule_code:
        query = query.filter(Finding.rule_code == rule_code)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Submission.title.ilike(search_pattern),
                Finding.matched_text.ilike(search_pattern),
                Finding.rule_code.ilike(search_pattern),
                Finding.title.ilike(search_pattern),
            )
        )

    # Sorting
    if sort_by == "rule_code":
        order_col = Finding.rule_code.asc() if sort_order == "asc" else Finding.rule_code.desc()
    elif sort_by == "severity":
        order_col = Finding.severity.asc() if sort_order == "asc" else Finding.severity.desc()
    else:
        order_col = Finding.created_at.asc() if sort_order == "asc" else Finding.created_at.desc()

    total = query.count()
    rows = query.order_by(order_col).offset((page - 1) * page_size).limit(page_size).all()

    items = [
        ReviewQueueItemResponse(
            id=str(r[0].id),
            check_run_id=str(r[0].check_run_id),
            submission_id=str(r.submission_id),
            submission_title=r.submission_title,
            submission_channel=r.submission_channel,
            submission_status=r.submission_status,
            creator_id=str(r.creator_id) if r.creator_id else None,
            creator_name=r.creator_name,
            rule_code=r[0].rule_code,
            category=r[0].category,
            severity=r[0].severity,
            title=r[0].title,
            matched_text=r[0].matched_text,
            start_offset=r[0].start_offset,
            end_offset=r[0].end_offset,
            suggested_fix=r[0].suggested_fix,
            receipt_a_draft_span=r[0].receipt_a_draft_span,
            receipt_b_rule_quote=r[0].receipt_b_rule_quote,
            source_document_title=r[0].source_document_title,
            source_section=r[0].source_section,
            status=r[0].status,
            created_at=r[0].created_at,
        )
        for r in rows
    ]

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return ReviewQueueResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post(
    "/review/batch-override",
    response_model=BatchOverrideResponse,
    status_code=status.HTTP_200_OK,
    summary="Record batch human reviewer overrides with mandatory taxonomy reason code (PROP-U08)",
)
def batch_override_findings(
    payload: BatchOverrideRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("reviewer", "brand_manager")),
):
    """
    Executes atomic batch overrides for selected compliance findings.
    Validates reason code taxonomy, creates individual Decision and immutable AuditLog records,
    and updates parent submission statuses when all findings are resolved.
    """
    set_tenant_context(db, str(current_user.workspace_id))

    standard_codes = {
        "SCOPE_MISMATCH",
        "APPROVED_EXCEPTION",
        "FALSE_POSITIVE",
        "LEGAL_DIRECTIVE",
        "LEGACY_CONTENT",
    }
    db_reason = (
        db.query(ReasonCode)
        .filter(
            ReasonCode.workspace_id == current_user.workspace_id,
            ReasonCode.code == payload.reason_code,
            ReasonCode.is_active == True,
        )
        .first()
    )

    if not db_reason and payload.reason_code not in standard_codes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": {
                    "code": "INVALID_REASON_CODE",
                    "message": f"Reason code '{payload.reason_code}' is not recognized in the governance taxonomy.",
                    "details": {"allowed_codes": list(standard_codes)},
                }
            },
        )

    try:
        finding_uuids = [uuid.UUID(fid) for fid in payload.finding_ids]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": {
                    "code": "INVALID_UUID",
                    "message": "One or more finding IDs are invalid UUIDs.",
                    "details": {"error": str(e)},
                }
            },
        )

    findings = (
        db.query(Finding)
        .filter(
            Finding.workspace_id == current_user.workspace_id,
            Finding.id.in_(finding_uuids),
        )
        .all()
    )

    if not findings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "FINDINGS_NOT_FOUND",
                    "message": "No matching findings found in your workspace.",
                    "details": {},
                }
            },
        )

    affected_ids: list[str] = []
    affected_check_runs: set[uuid.UUID] = set()

    for finding in findings:
        if finding.status == "OVERRIDDEN":
            continue

        prev_status = finding.status
        finding.status = "OVERRIDDEN"

        decision = Decision(
            workspace_id=current_user.workspace_id,
            finding_id=finding.id,
            reviewer_id=current_user.id,
            decision_type=payload.decision_type,
            reason_code=payload.reason_code,
            justification=payload.justification,
        )
        db.add(decision)
        db.flush()

        audit = AuditLog(
            workspace_id=current_user.workspace_id,
            actor_id=current_user.id,
            action="FINDING_OVERRIDE",
            entity_type="FINDING",
            entity_id=finding.id,
            previous_state={"status": prev_status},
            new_state={
                "status": "OVERRIDDEN",
                "reason_code": payload.reason_code,
                "justification": payload.justification,
                "decision_id": str(decision.id),
                "batch": True,
            },
        )
        db.add(audit)

        affected_ids.append(str(finding.id))
        affected_check_runs.add(finding.check_run_id)

    # Update check runs and parent submissions
    for cr_id in affected_check_runs:
        check_run = db.query(CheckRun).filter(CheckRun.id == cr_id).first()
        if check_run:
            check_run.total_overrides = (
                db.query(Finding)
                .filter(Finding.check_run_id == cr_id, Finding.status == "OVERRIDDEN")
                .count()
            )

            all_findings = db.query(Finding).filter(Finding.check_run_id == cr_id).all()
            if all(f.status in ("OVERRIDDEN", "FIXED") for f in all_findings):
                sub = db.query(Submission).filter(Submission.id == check_run.submission_id).first()
                if sub and sub.status != "APPROVED":
                    sub.status = "APPROVED_WITH_OVERRIDE"

    db.commit()

    return BatchOverrideResponse(
        overridden_count=len(affected_ids),
        affected_finding_ids=affected_ids,
        reason_code=payload.reason_code,
        justification=payload.justification,
    )
