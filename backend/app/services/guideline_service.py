"""Guideline ingestion, normalization, SHA-256 hashing, and rule compilation service."""

import hashlib
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from app.core.database import set_tenant_context
from app.models.policy import ApprovedClaim, PolicyVersion, Rule, SourceDocument
from app.services.normalizer import normalize_text


def compute_content_hash(text: str) -> str:
    """Computes SHA-256 hex digest for document content."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def ingest_guideline_document(
    db: Session,
    workspace_id: uuid.UUID,
    title: str,
    raw_text: str,
    uploaded_by: uuid.UUID,
    storage_path: str = "guidelines/source.txt",
    page_count: int = 1,
) -> SourceDocument:
    """
    Ingests brand guideline text, computes immutable SHA-256 content hash,
    normalizes Unicode characters, and persists SourceDocument.
    """
    set_tenant_context(db, str(workspace_id))
    content_hash = compute_content_hash(raw_text)

    # Check for existing document with same hash in this workspace
    existing = (
        db.query(SourceDocument)
        .filter(
            SourceDocument.workspace_id == workspace_id,
            SourceDocument.content_hash == content_hash,
        )
        .first()
    )
    if existing:
        return existing

    normalized_text, _ = normalize_text(raw_text)

    doc = SourceDocument(
        workspace_id=workspace_id,
        title=title,
        document_type="GUIDELINE",
        storage_path=storage_path,
        content_hash=content_hash,
        page_count=page_count,
        extracted_text=normalized_text,
        status="PARSED",
        uploaded_by=uploaded_by,
    )
    db.add(doc)
    db.flush()
    return doc


def compile_policy_version(
    db: Session,
    workspace_id: uuid.UUID,
    source_document_id: uuid.UUID,
    created_by: uuid.UUID,
    rules_data: list[dict[str, Any]],
    claims_data: list[dict[str, Any]],
    version_number: str = "1.0",
    change_summary: str = "Initial release",
    activate_with_human_approver: uuid.UUID | None = None,
) -> PolicyVersion:
    """
    Compiles an immutable PolicyVersion with rules and approved claims.
    If activate_with_human_approver is specified, activates the policy version
    under the human's explicit identity (enforcing chk_active_policy_must_be_human_approved).
    """
    set_tenant_context(db, str(workspace_id))

    is_active = activate_with_human_approver is not None
    status = "ACTIVE" if is_active else "DRAFT"
    approved_by = activate_with_human_approver if is_active else None
    approved_at = datetime.now(UTC) if is_active else None

    policy_version = PolicyVersion(
        workspace_id=workspace_id,
        source_document_id=source_document_id,
        version_number=version_number,
        status=status,
        compiled_rules_count=len(rules_data),
        change_summary=change_summary,
        created_by=created_by,
        approved_by=approved_by,
        approved_at=approved_at,
        effective_date=datetime.now(UTC),
    )
    db.add(policy_version)
    db.flush()

    # Attach compiled rules
    for r in rules_data:
        rule = Rule(
            workspace_id=workspace_id,
            policy_version_id=policy_version.id,
            rule_code=r["rule_code"],
            category=r.get("category", "TERMINOLOGY"),
            severity=r.get("severity", "WARNING"),
            title=r.get("title", ""),
            description=r.get("description", r.get("title", "")),
            pattern_or_term=r.get("forbidden_term", r.get("pattern_or_term", "")),
            suggested_replacement=r.get("suggested_replacement", ""),
            source_citation=r.get("source_citation", {}),
            is_active=True,
        )
        db.add(rule)

    # Attach approved claims
    for c in claims_data:
        v_from = c["valid_from"]
        if isinstance(v_from, str):
            v_from = datetime.fromisoformat(v_from).replace(tzinfo=UTC)
        v_until = c["valid_until"]
        if isinstance(v_until, str):
            v_until = datetime.fromisoformat(v_until).replace(tzinfo=UTC)

        claim = ApprovedClaim(
            workspace_id=workspace_id,
            policy_version_id=policy_version.id,
            claim_code=c["claim_code"],
            claim_text=c["claim_text"],
            substantiation=c.get("substantiation", ""),
            valid_from=v_from,
            valid_until=v_until,
            is_active=True,
        )
        db.add(claim)

    db.flush()
    return policy_version
