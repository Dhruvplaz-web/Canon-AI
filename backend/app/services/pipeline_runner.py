"""In-process Check Pipeline Job Runner.

Orchestrates verification stages:
1. Normalization & Bi-directional Offset Mapping
2. Pre-flight Prompt Injection Sanitizer
3. Deterministic Forbidden Terms & Brand Typo Engine
4. Deterministic Approved Claims Ledger & Expired Claim Validator
5. Double-Receipt Generation & Atomic Database Persistence
"""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.core.database import set_tenant_context
from app.models.check import CheckRun, Finding
from app.models.policy import PolicyVersion, Rule
from app.models.submission import Submission, SubmissionVersion
from app.pipeline.verifier import verify_candidate_finding
from app.services.claims_engine import scan_claims
from app.services.injection_scanner import scan_for_injections
from app.services.semantic_engine import scan_semantic_violations
from app.services.terms_engine import scan_terms_and_typos

logger = logging.getLogger("canon.pipeline")


def run_check_pipeline(
    db: Session,
    submission_id: uuid.UUID,
    version_number: int | None = None,
    as_of: datetime | str | None = None,
    dry_run: bool = False,
) -> CheckRun:
    """
    Executes the multi-stage brand compliance verification pipeline
    synchronously against a specific submission version.
    Supports temporal simulation via as_of and non-destructive dry_run.
    """
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise ValueError(f"Submission {submission_id} does not exist.")

    set_tenant_context(db, str(submission.workspace_id))

    target_ver_num = version_number or submission.current_version_number
    sub_version = (
        db.query(SubmissionVersion)
        .filter(
            SubmissionVersion.submission_id == submission.id,
            SubmissionVersion.version_number == target_ver_num,
        )
        .first()
    )
    if not sub_version:
        raise ValueError(f"Version {target_ver_num} not found for submission {submission_id}.")

    # Fetch Active Policy for the workspace
    policy = (
        db.query(PolicyVersion)
        .filter(
            PolicyVersion.workspace_id == submission.workspace_id,
            PolicyVersion.status == "ACTIVE",
        )
        .first()
    )
    if not policy:
        raise ValueError(f"No active brand policy version found for workspace {submission.workspace_id}.")

    # Initialize CheckRun
    check_run = CheckRun(
        workspace_id=submission.workspace_id,
        submission_id=submission.id,
        submission_version_id=sub_version.id,
        policy_version_id=policy.id,
        status="RUNNING",
        total_findings=0,
        total_overrides=0,
        started_at=datetime.now(UTC),
    )
    db.add(check_run)
    db.flush()

    raw_text = sub_version.content
    findings_to_persist: list[Finding] = []

    # Map of rule_code to rule ORM model
    rules_map: dict[str, Rule] = {r.rule_code: r for r in policy.rules}

    # Stage 1: Pre-flight Prompt Injection Security Scan
    sec_result = scan_for_injections(raw_text)
    if not sec_result.is_safe:
        for sec_finding in sec_result.findings:
            finding = Finding(
                workspace_id=submission.workspace_id,
                check_run_id=check_run.id,
                rule_id=None,
                rule_code=sec_finding.rule_code,
                category="SECURITY",
                severity="CRITICAL",
                title="Adversarial Prompt Injection Attempt",
                matched_text=sec_finding.matched_text,
                start_offset=sec_finding.start_offset,
                end_offset=sec_finding.end_offset,
                suggested_fix="Sanitize input text to remove adversarial prompt injection markers.",
                receipt_a_draft_span=sec_finding.matched_text,
                receipt_b_rule_quote="Prohibition of prompt injection, model jailbreaking, and instruction override delimiters.",
                source_document_title="AI Safety & Security Policy",
                source_section="SECTION 0: LLM ADVERSARIAL SAFEGUARDS",
                status="PENDING_REVIEW",
            )
            findings_to_persist.append(finding)

    # Stage 2: Deterministic Forbidden Terms & Brand Typo Engine
    term_findings = scan_terms_and_typos(raw_text, policy.rules)
    for tf in term_findings:
        matched_rule = rules_map.get(tf.rule_code)
        doc_title = (
            tf.source_citation.get("document", "Brand Guidelines 2026")
            if isinstance(tf.source_citation, dict)
            else "Brand Guidelines 2026"
        )
        sec_name = (
            tf.source_citation.get("section", "STATUTORY BRAND IDENTITY")
            if isinstance(tf.source_citation, dict)
            else "STATUTORY BRAND IDENTITY"
        )

        finding = Finding(
            workspace_id=submission.workspace_id,
            check_run_id=check_run.id,
            rule_id=matched_rule.id if matched_rule else None,
            rule_code=tf.rule_code,
            category=tf.category,
            severity=tf.severity,
            title=tf.title,
            matched_text=tf.flagged_text,
            start_offset=tf.start_offset,
            end_offset=tf.end_offset,
            suggested_fix=tf.suggested_fix,
            receipt_a_draft_span=tf.flagged_text,
            receipt_b_rule_quote=tf.source_quote,
            source_document_title=doc_title,
            source_section=sec_name,
            status="PENDING_REVIEW",
        )
        findings_to_persist.append(finding)

    # Stage 3: Approved Claims Ledger & Expired Claim Validator
    claim_findings = scan_claims(raw_text, policy.approved_claims, as_of=as_of)
    for cf in claim_findings:
        finding = Finding(
            workspace_id=submission.workspace_id,
            check_run_id=check_run.id,
            rule_id=None,
            rule_code=cf.rule_code,
            category=cf.category,
            severity=cf.severity,
            title=cf.title,
            matched_text=cf.flagged_text,
            start_offset=cf.start_offset,
            end_offset=cf.end_offset,
            suggested_fix=cf.suggested_fix,
            receipt_a_draft_span=cf.flagged_text,
            receipt_b_rule_quote=cf.source_quote,
            source_document_title="Approved Claims Ledger",
            source_section="CLAIMS & SUBSTANTIATION LEDGER",
            status="PENDING_REVIEW",
        )
        findings_to_persist.append(finding)

    # Stage 4: Semantic Tone & Policy Intent Scanner (LLM Adapter)
    semantic_findings = scan_semantic_violations(raw_text, policy.rules)
    for sf in semantic_findings:
        matched_rule = rules_map.get(sf.rule_code)
        finding = Finding(
            workspace_id=submission.workspace_id,
            check_run_id=check_run.id,
            rule_id=matched_rule.id if matched_rule else None,
            rule_code=sf.rule_code,
            category=sf.category,
            severity=sf.severity,
            title=sf.title,
            matched_text=sf.flagged_text,
            start_offset=sf.start_offset,
            end_offset=sf.end_offset,
            suggested_fix=sf.suggested_fix,
            receipt_a_draft_span=sf.flagged_text,
            receipt_b_rule_quote=sf.source_quote,
            source_document_title=sf.source_document_title,
            source_section=sf.source_section,
            status="PENDING_REVIEW",
        )
        findings_to_persist.append(finding)

    # Double-Receipt Grounding Verification
    policy_source_texts: list[str] = [
        "Prohibition of prompt injection, model jailbreaking, and instruction override delimiters."
    ]
    for r in policy.rules:
        if r.description:
            policy_source_texts.append(r.description)
        if isinstance(r.source_citation, dict):
            for key in ("exact_quote", "quote", "source_quote"):
                val = r.source_citation.get(key)
                if val:
                    policy_source_texts.append(val)
    for c in policy.approved_claims:
        if c.claim_text:
            policy_source_texts.append(c.claim_text)
        if c.substantiation:
            policy_source_texts.append(c.substantiation)
            policy_source_texts.append(f"Claim: '{c.claim_text}' Substantiation: {c.substantiation}")

    verified_findings: list[Finding] = []
    for f in findings_to_persist:
        ver_res = verify_candidate_finding(f, raw_text, policy_source_texts)
        if ver_res.is_valid:
            verified_findings.append(f)
        else:
            logger.warning(
                "Candidate finding %s rejected by double-receipt verifier: %s",
                f.rule_code,
                ver_res.rejection_reason,
            )

    # Deduplicate overlapping findings by rule_code and span
    seen_keys = set()
    deduped_findings: list[Finding] = []
    for f in verified_findings:
        key = (f.rule_code, f.start_offset, f.end_offset)
        if key not in seen_keys:
            seen_keys.add(key)
            deduped_findings.append(f)
            db.add(f)

    # Finalize Check Run
    check_run.total_findings = len(deduped_findings)
    check_run.status = "COMPLETED"
    check_run.completed_at = datetime.now(UTC)

    if not dry_run:
        # Update submission status
        if len(deduped_findings) == 0:
            submission.status = "APPROVED"
        else:
            submission.status = "PENDING_REVIEW"

        db.commit()
        db.refresh(check_run)
        logger.info(
            "Completed check pipeline for submission %s: %d findings recorded.",
            submission_id,
            len(deduped_findings),
        )
    else:
        # Simulation / dry-run: rollback persistence to avoid altering canonical state
        db.rollback()
        check_run.findings = deduped_findings
        logger.info(
            "Completed simulation check pipeline for submission %s as_of=%s (dry run): %d findings emitted.",
            submission_id,
            as_of,
            len(deduped_findings),
        )
    return check_run
