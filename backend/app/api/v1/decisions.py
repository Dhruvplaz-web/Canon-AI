"""Human Reviewer Decisions, Override Actions, and Reason Code Endpoints."""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_role
from app.core.database import get_db, set_tenant_context
from app.models.audit import AuditLog
from app.models.check import CheckRun, Decision, Finding, ReasonCode
from app.models.submission import Submission
from app.models.workspace import User
from app.schemas.decision import DecisionResponse, OverrideFindingRequest, ReasonCodeResponse

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
