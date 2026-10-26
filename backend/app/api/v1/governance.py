"""Brand Governance Intelligence, Rule Health, Proposals, and Human Policy Adoption Endpoints."""

import logging
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_role
from app.core.database import get_db, set_tenant_context
from app.models.audit import AuditLog
from app.models.governance import RuleChangeProposal, RuleHealthSnapshot
from app.models.policy import ApprovedClaim, PolicyVersion, Rule
from app.models.workspace import User
from app.schemas.governance import (
    ActivePolicyResponse,
    AdoptProposalResponse,
    ApprovedClaimResponse,
    BacktestRunResponse,
    ProposalResponse,
    RuleDetailResponse,
    RuleHealthResponse,
)
from app.services.backtest_engine import execute_proposal_backtest

logger = logging.getLogger("canon.governance")
router = APIRouter(prefix="/governance", tags=["Brand Governance Intelligence"])


@router.get(
    "/policy/active",
    response_model=ActivePolicyResponse,
    summary="Get active brand policy version with compiled rules and approved claims ledger",
)
def get_active_policy(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the currently active policy version for the authenticated workspace,
    including all compiled executable rules and the temporal claims ledger.
    """
    set_tenant_context(db, str(current_user.workspace_id))
    policy = (
        db.query(PolicyVersion)
        .filter(
            PolicyVersion.workspace_id == current_user.workspace_id,
            PolicyVersion.status == "ACTIVE",
        )
        .first()
    )
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "ACTIVE_POLICY_NOT_FOUND",
                    "message": "No active brand policy version found for this workspace.",
                    "details": {},
                }
            },
        )

    # Sort rules by category, then severity (CRITICAL first), then rule_code
    sev_order = {"CRITICAL": 0, "MAJOR": 1, "MINOR": 2}
    sorted_rules = sorted(
        policy.rules,
        key=lambda r: (r.category, sev_order.get(r.severity, 3), r.rule_code),
    )

    sorted_claims = sorted(
        policy.approved_claims,
        key=lambda c: c.claim_code,
    )

    return ActivePolicyResponse(
        id=str(policy.id),
        version_number=policy.version_number,
        status=policy.status,
        compiled_rules_count=len(policy.rules),
        change_summary=policy.change_summary,
        approved_by=str(policy.approved_by) if policy.approved_by else None,
        approved_at=policy.approved_at,
        effective_date=policy.effective_date,
        rules=[
            RuleDetailResponse(
                id=str(r.id),
                rule_code=r.rule_code,
                category=r.category,
                severity=r.severity,
                title=r.title,
                description=r.description,
                pattern_or_term=r.pattern_or_term,
                suggested_replacement=r.suggested_replacement,
                source_citation=r.source_citation if isinstance(r.source_citation, dict) else {},
                is_active=r.is_active,
            )
            for r in sorted_rules
        ],
        approved_claims=[
            ApprovedClaimResponse(
                id=str(c.id),
                claim_code=c.claim_code,
                claim_text=c.claim_text,
                substantiation=c.substantiation,
                valid_from=c.valid_from,
                valid_until=c.valid_until,
                is_active=c.is_active,
            )
            for c in sorted_claims
        ],
    )


@router.get(
    "/health",
    response_model=list[RuleHealthResponse],
    summary="List rule health diagnostics and override telemetry",
)
def get_rule_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns rule health snapshots displaying override rates and friction diagnostics."""
    set_tenant_context(db, str(current_user.workspace_id))
    snapshots = (
        db.query(RuleHealthSnapshot)
        .filter(RuleHealthSnapshot.workspace_id == current_user.workspace_id)
        .order_by(RuleHealthSnapshot.override_rate.desc())
        .all()
    )

    return [
        RuleHealthResponse(
            id=str(s.id),
            rule_code=s.rule_code,
            snapshot_date=s.snapshot_date,
            total_evaluations=s.total_evaluations,
            total_flags=s.total_flags,
            total_overrides=s.total_overrides,
            override_rate=round(s.override_rate, 4),
            diagnostic_status=s.diagnostic_status,
            primary_override_reason=s.primary_override_reason,
        )
        for s in snapshots
    ]


@router.get(
    "/proposals",
    response_model=list[ProposalResponse],
    summary="List candidate policy change proposals",
)
def list_proposals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns candidate policy modification proposals synthesized from reviewer telemetry."""
    set_tenant_context(db, str(current_user.workspace_id))
    proposals = (
        db.query(RuleChangeProposal)
        .filter(RuleChangeProposal.workspace_id == current_user.workspace_id)
        .order_by(RuleChangeProposal.created_at.desc())
        .all()
    )

    return [
        ProposalResponse(
            id=str(p.id),
            proposal_code=p.proposal_code,
            policy_version_id=str(p.policy_version_id),
            target_rule_code=p.target_rule_code,
            title=p.title,
            rationale=p.rationale,
            proposed_diff=p.proposed_diff,
            status=p.status,
            created_by=str(p.created_by),
            adopted_at=p.adopted_at,
            created_at=p.created_at,
        )
        for p in proposals
    ]


@router.get(
    "/proposals/{proposal_id}",
    response_model=ProposalResponse,
    summary="Get proposal details by ID",
)
def get_proposal(
    proposal_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns details for a specific proposal."""
    set_tenant_context(db, str(current_user.workspace_id))
    prop = (
        db.query(RuleChangeProposal)
        .filter(
            RuleChangeProposal.id == proposal_id,
            RuleChangeProposal.workspace_id == current_user.workspace_id,
        )
        .first()
    )
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "PROPOSAL_NOT_FOUND",
                    "message": f"Proposal {proposal_id} was not found.",
                    "details": {"proposal_id": str(proposal_id)},
                }
            },
        )

    return ProposalResponse(
        id=str(prop.id),
        proposal_code=prop.proposal_code,
        policy_version_id=str(prop.policy_version_id),
        target_rule_code=prop.target_rule_code,
        title=prop.title,
        rationale=prop.rationale,
        proposed_diff=prop.proposed_diff,
        status=prop.status,
        created_by=str(prop.created_by),
        adopted_at=prop.adopted_at,
        created_at=prop.created_at,
    )


@router.post(
    "/proposals/{proposal_id}/backtest",
    response_model=BacktestRunResponse,
    summary="Execute backtest simulation for candidate proposal",
)
def backtest_proposal(
    proposal_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("reviewer", "brand_manager")),
):
    """
    Executes backtest simulation replaying historical submissions against the proposed diff.
    Verifies pass rate delta and confirms zero critical regressions.
    """
    set_tenant_context(db, str(current_user.workspace_id))
    prop = (
        db.query(RuleChangeProposal)
        .filter(
            RuleChangeProposal.id == proposal_id,
            RuleChangeProposal.workspace_id == current_user.workspace_id,
        )
        .first()
    )
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "PROPOSAL_NOT_FOUND",
                    "message": f"Proposal {proposal_id} was not found.",
                    "details": {"proposal_id": str(proposal_id)},
                }
            },
        )

    b_run = execute_proposal_backtest(db, prop)

    return BacktestRunResponse(
        id=str(b_run.id),
        proposal_id=str(b_run.proposal_id),
        status=b_run.status,
        historical_submissions_analyzed=b_run.historical_submissions_analyzed,
        prior_pass_rate=round(b_run.prior_pass_rate, 4),
        simulated_pass_rate=round(b_run.simulated_pass_rate, 4),
        false_positives_eliminated=b_run.false_positives_eliminated,
        regressions_detected=b_run.regressions_detected,
        safety_score=round(b_run.safety_score, 2),
        recommendation=b_run.recommendation,
        started_at=b_run.started_at,
        completed_at=b_run.completed_at,
    )


@router.post(
    "/proposals/{proposal_id}/adopt",
    response_model=AdoptProposalResponse,
    summary="Human Brand Manager adopts proposal creating Policy v1.1",
)
def adopt_proposal(
    proposal_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("brand_manager")),
):
    """
    BINDING ACCEPTANCE INVARIANT (JRN-06, TST-14):
    Policy v1.1 is NEVER auto-activated by the system.
    Activation occurs strictly upon explicit human Brand Manager approval.
    Creates Policy v1.1 with approved_by set to the human caller, archives v1.0,
    marks proposal as ADOPTED, and appends an immutable compliance audit record.
    """
    set_tenant_context(db, str(current_user.workspace_id))

    prop = (
        db.query(RuleChangeProposal)
        .filter(
            RuleChangeProposal.id == proposal_id,
            RuleChangeProposal.workspace_id == current_user.workspace_id,
        )
        .first()
    )
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "PROPOSAL_NOT_FOUND",
                    "message": f"Proposal {proposal_id} was not found.",
                    "details": {"proposal_id": str(proposal_id)},
                }
            },
        )

    if prop.status == "ADOPTED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": {
                    "code": "PROPOSAL_ALREADY_ADOPTED",
                    "message": f"Proposal {prop.proposal_code} has already been adopted.",
                    "details": {"proposal_id": str(proposal_id)},
                }
            },
        )

    # Fetch currently active policy (v1.0)
    current_policy = (
        db.query(PolicyVersion)
        .filter(
            PolicyVersion.workspace_id == current_user.workspace_id,
            PolicyVersion.status == "ACTIVE",
        )
        .first()
    )
    if not current_policy:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "NO_ACTIVE_POLICY",
                    "message": "No active baseline policy found to upgrade.",
                    "details": {},
                }
            },
        )

    now = datetime.now(UTC)

    # 1. Create Policy v1.1 (Human Approved)
    new_policy = PolicyVersion(
        workspace_id=current_user.workspace_id,
        source_document_id=current_policy.source_document_id,
        version_number="1.1",
        status="ACTIVE",
        compiled_rules_count=len(current_policy.rules),
        change_summary=f"Adopted proposal {prop.proposal_code}: {prop.title}",
        created_by=current_user.id,
        approved_by=current_user.id,  # Explicit Human Approver ID
        approved_at=now,
        effective_date=now,
    )
    db.add(new_policy)
    db.flush()

    # 2. Clone rules into v1.1, applying the proposed diff
    for r in current_policy.rules:
        is_target = r.rule_code == prop.target_rule_code
        diff = prop.proposed_diff if is_target else {}

        new_desc = diff.get("proposed_text", r.description)
        new_citation = dict(r.source_citation) if isinstance(r.source_citation, dict) else {}
        if is_target and "proposed_text" in diff:
            new_citation["exact_quote"] = diff["proposed_text"]

        cloned_rule = Rule(
            workspace_id=current_user.workspace_id,
            policy_version_id=new_policy.id,
            rule_code=r.rule_code,
            category=r.category,
            severity=r.severity,
            title=r.title,
            description=new_desc,
            pattern_or_term=r.pattern_or_term,
            suggested_replacement=r.suggested_replacement,
            source_citation=new_citation,
            is_active=True,
        )
        db.add(cloned_rule)

    # 3. Clone approved claims into v1.1
    for c in current_policy.approved_claims:
        cloned_claim = ApprovedClaim(
            workspace_id=current_user.workspace_id,
            policy_version_id=new_policy.id,
            claim_code=c.claim_code,
            claim_text=c.claim_text,
            substantiation=c.substantiation,
            valid_from=c.valid_from,
            valid_until=c.valid_until,
            is_active=c.is_active,
        )
        db.add(cloned_claim)

    # 4. Archive old policy v1.0
    current_policy.status = "ARCHIVED"

    # 5. Mark Proposal as ADOPTED
    prop.status = "ADOPTED"
    prop.adopted_at = now

    # 6. Append Immutable AuditLog Entry
    audit_entry = AuditLog(
        workspace_id=current_user.workspace_id,
        actor_id=current_user.id,
        action="POLICY_ADOPT_V1_1",
        entity_type="POLICY_VERSION",
        entity_id=new_policy.id,
        previous_state={
            "active_version": current_policy.version_number,
            "policy_id": str(current_policy.id),
        },
        new_state={
            "active_version": "1.1",
            "policy_id": str(new_policy.id),
            "proposal_id": str(prop.id),
            "proposal_code": prop.proposal_code,
            "approved_by": str(current_user.id),
            "approved_at": now.isoformat(),
        },
    )
    db.add(audit_entry)

    db.commit()
    db.refresh(new_policy)

    logger.info(
        "Brand Manager %s adopted proposal %s into Policy v1.1 (id=%s).",
        current_user.id,
        prop.proposal_code,
        new_policy.id,
    )

    return AdoptProposalResponse(
        proposal_id=str(prop.id),
        proposal_code=prop.proposal_code,
        new_policy_version_id=str(new_policy.id),
        version_number=new_policy.version_number,
        status=new_policy.status,
        approved_by=str(current_user.id),
        approved_at=new_policy.approved_at,
        message=f"Proposal {prop.proposal_code} successfully approved by Brand Manager and activated as Policy v1.1.",
    )
