"""Seed demo data script for Canon Brand Governance platform.

Populates Acme Corporation workspace, 4 RBAC users, Brand Guidelines,
Active Policy v1.0 (with 12 rules and approved claims ledger including expired claim),
12 standard reason codes, rule health snapshot for TERM-007, deterministic proposal PROP-01,
and 3 sample submissions. Idempotent across multiple runs.
"""

import json
import logging
import sys
import uuid
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy.orm import Session

# Add backend directory to sys.path if invoked directly
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal, set_tenant_context
from app.core.security import hash_password
from app.models.check import ReasonCode
from app.models.governance import BacktestRun, RuleChangeProposal, RuleHealthSnapshot
from app.models.policy import ApprovedClaim, PolicyVersion, Rule, SourceDocument
from app.models.submission import Submission, SubmissionVersion
from app.models.workspace import User, Workspace
from app.services.normalizer import normalize_text

logger = logging.getLogger("canon.seed")

# Deterministic UUIDs for repeatable demo fixtures
WORKSPACE_ID = uuid.UUID("0192e850-89ab-7d31-b6a4-22b6ffbfb3b1")
BM_USER_ID = uuid.UUID("0192e850-89ab-7d31-b6a4-22b6ffbfb3b2")
REVIEWER_USER_ID = uuid.UUID("0192e850-89ab-7d31-b6a4-22b6ffbfb3b3")
CREATOR_USER_ID = uuid.UUID("0192e850-89ab-7d31-b6a4-22b6ffbfb3b4")
APPROVER_USER_ID = uuid.UUID("0192e850-89ab-7d31-b6a4-22b6ffbfb3b5")
SOURCE_DOC_ID = uuid.UUID("0192e850-89ab-7d31-b6a4-22b6ffbfb3b6")
POLICY_V1_ID = uuid.UUID("0192e850-89ab-7d31-b6a4-22b6ffbfb3b7")
PROPOSAL_PROP01_ID = uuid.UUID("0192e850-89ab-7d31-b6a4-22b6ffbfb3b8")
BACKTEST_RUN_ID = uuid.UUID("0192e850-89ab-7d31-b6a4-22b6ffbfb3b9")

REPO_ROOT = backend_dir.parent
DATA_DIR = REPO_ROOT / "data"

STANDARD_REASON_CODES = [
    (
        "APPROVED_CAMPAIGN_EXCEPTION",
        "Approved Campaign Exception",
        "Exception approved by Brand Director for named campaign",
    ),
    (
        "JUSTIFIED_EDUCATIONAL_CONTEXT",
        "Justified Educational Context",
        "Educational or technical thought leadership context",
    ),
    (
        "PARTNER_PORTAL_EXEMPTION",
        "Partner Portal Exemption",
        "Published exclusively in closed enterprise partner portal",
    ),
    (
        "LEGAL_PRE_APPROVED_VARIATION",
        "Legal Pre-Approved Variation",
        "Legal team pre-cleared copy variation",
    ),
    (
        "DEFECTIVE_RULE_TOO_BROAD",
        "Defective Rule: Too Broad",
        "Rule trigger pattern is overly broad and catches benign phrases",
    ),
    (
        "DEFECTIVE_RULE_AMBIGUOUS",
        "Defective Rule: Ambiguous",
        "Rule wording creates ambiguity in acceptable context",
    ),
    (
        "DEFECTIVE_RULE_OBSOLETE",
        "Defective Rule: Obsolete",
        "Rule no longer reflects brand guidelines",
    ),
    (
        "CONTEXT_HISTORICAL_REFERENCE",
        "Context: Historical Reference",
        "Historical brand reference or direct quote",
    ),
    (
        "CONTEXT_TECHNICAL_SPECIFICATION",
        "Context: Technical Specification",
        "Literal technical parameter or API specification",
    ),
    (
        "CONTEXT_THIRD_PARTY_TRADEMARK",
        "Context: Third-Party Trademark",
        "Required third-party trademark attribution",
    ),
    (
        "CREATIVE_EDITORIAL_LICENSE",
        "Creative Editorial License",
        "Deliberate stylistic copy approved for marketing hero",
    ),
    (
        "ACQUISITION_CO_BRANDING",
        "Acquisition Co-Branding",
        "Co-marketing material with acquired partner firm",
    ),
]


def seed(db: Session) -> dict:
    """Executes idempotent seeding of demo data, returning summary dict."""
    logger.info("Beginning Canon seed execution...")

    # 1. Workspace
    workspace = db.query(Workspace).filter(Workspace.slug == "acme-corp").first()
    if not workspace:
        workspace = Workspace(
            id=WORKSPACE_ID,
            name="Acme Corporation",
            slug="acme-corp",
            settings={
                "ai_mode": "HYBRID",
                "default_locale": "en-US",
                "min_sample_size": 20,
            },
        )
        db.add(workspace)
        db.flush()
        logger.info("Created Workspace: Acme Corporation (%s)", workspace.id)
    else:
        logger.info("Workspace acme-corp already exists.")

    # Set tenant context
    set_tenant_context(db, str(workspace.id))

    # 2. RBAC Users
    users_data = [
        (
            BM_USER_ID,
            "brand_manager@acme.corp",
            "BrandManager2026!",
            "Alice Brand",
            "brand_manager",
        ),
        (REVIEWER_USER_ID, "reviewer@acme.corp", "Reviewer2026!", "Rachel Reviewer", "reviewer"),
        (CREATOR_USER_ID, "creator@acme.corp", "Creator2026!", "Charlie Creator", "creator"),
        (APPROVER_USER_ID, "approver@acme.corp", "Approver2026!", "Arthur Approver", "approver"),
    ]
    created_users = []
    for uid, email, raw_pass, full_name, role in users_data:
        user = db.query(User).filter(User.workspace_id == workspace.id, User.email == email).first()
        if not user:
            user = User(
                id=uid,
                workspace_id=workspace.id,
                email=email,
                password_hash=hash_password(raw_pass),
                full_name=full_name,
                role=role,
                is_active=True,
            )
            db.add(user)
            db.flush()
            created_users.append(email)
    logger.info("Verified RBAC users: %d users configured.", len(users_data))

    # 3. Source Document
    guideline_txt_path = DATA_DIR / "demo_policy" / "guideline_source.txt"
    if guideline_txt_path.exists():
        raw_text = guideline_txt_path.read_text(encoding="utf-8")
    else:
        raw_text = "Acme Brand Guidelines 2026 Source Text."

    import hashlib

    content_hash = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()

    source_doc = (
        db.query(SourceDocument)
        .filter(
            SourceDocument.workspace_id == workspace.id,
            SourceDocument.content_hash == content_hash,
        )
        .first()
    )

    if not source_doc:
        source_doc = SourceDocument(
            id=SOURCE_DOC_ID,
            workspace_id=workspace.id,
            title="Acme Brand Guidelines 2026",
            document_type="GUIDELINE",
            storage_path="demo_policy/guideline_source.txt",
            content_hash=content_hash,
            page_count=2,
            extracted_text=raw_text,
            status="PARSED",
            uploaded_by=BM_USER_ID,
        )
        db.add(source_doc)
        db.flush()
        logger.info("Created SourceDocument: Acme Brand Guidelines 2026")

    # 4. Active Policy Version v1.0
    policy_v1 = (
        db.query(PolicyVersion)
        .filter(
            PolicyVersion.workspace_id == workspace.id,
            PolicyVersion.version_number == "1.0",
        )
        .first()
    )

    if not policy_v1:
        policy_v1 = PolicyVersion(
            id=POLICY_V1_ID,
            workspace_id=workspace.id,
            source_document_id=source_doc.id,
            version_number="1.0",
            status="ACTIVE",
            compiled_rules_count=12,
            change_summary="Initial verified brand governance rules and approved claims ledger.",
            created_by=BM_USER_ID,
            approved_by=BM_USER_ID,
            approved_at=datetime.now(UTC),
            effective_date=datetime(2026, 1, 1, tzinfo=UTC),
        )
        db.add(policy_v1)
        db.flush()
        logger.info("Created Active PolicyVersion v1.0")

    # 5. Rules & Approved Claims from rules.json
    rules_json_path = DATA_DIR / "demo_policy" / "rules.json"
    rules_data = []
    claims_data = []
    if rules_json_path.exists():
        parsed = json.loads(rules_json_path.read_text(encoding="utf-8"))
        rules_data = parsed.get("rules", [])
        claims_data = parsed.get("approved_claims", [])

    for r in rules_data:
        rule_code = r["rule_code"]
        existing_rule = (
            db.query(Rule)
            .filter(
                Rule.policy_version_id == policy_v1.id,
                Rule.rule_code == rule_code,
            )
            .first()
        )
        if not existing_rule:
            rule_obj = Rule(
                workspace_id=workspace.id,
                policy_version_id=policy_v1.id,
                rule_code=rule_code,
                category=r.get("category", "TERMINOLOGY"),
                severity=r.get("severity", "WARNING"),
                title=r.get("title", ""),
                description=r.get("title", ""),
                pattern_or_term=r.get("forbidden_term", ""),
                suggested_replacement=r.get("suggested_replacement", ""),
                source_citation=r.get("source_citation", {}),
                is_active=True,
            )
            db.add(rule_obj)
    db.flush()
    logger.info("Configured %d rules for Policy v1.0", len(rules_data))

    # Approved Claims
    for c in claims_data:
        claim_code = c["claim_code"]
        existing_claim = (
            db.query(ApprovedClaim)
            .filter(
                ApprovedClaim.policy_version_id == policy_v1.id,
                ApprovedClaim.claim_code == claim_code,
            )
            .first()
        )
        if not existing_claim:
            v_from = datetime.fromisoformat(c["valid_from"]).replace(tzinfo=UTC)
            v_until = datetime.fromisoformat(c["valid_until"]).replace(tzinfo=UTC)
            claim_obj = ApprovedClaim(
                workspace_id=workspace.id,
                policy_version_id=policy_v1.id,
                claim_code=claim_code,
                claim_text=c["claim_text"],
                substantiation=c["substantiation"],
                valid_from=v_from,
                valid_until=v_until,
                is_active=True,
            )
            db.add(claim_obj)
    db.flush()
    logger.info("Configured %d approved claims for Policy v1.0", len(claims_data))

    # 6. Reason Codes
    for code, title, desc in STANDARD_REASON_CODES:
        rc = (
            db.query(ReasonCode)
            .filter(
                ReasonCode.workspace_id == workspace.id,
                ReasonCode.code == code,
            )
            .first()
        )
        if not rc:
            rc = ReasonCode(
                workspace_id=workspace.id,
                code=code,
                title=title,
                description=desc,
                is_active=True,
            )
            db.add(rc)
    db.flush()
    logger.info("Configured %d standard reason codes", len(STANDARD_REASON_CODES))

    # 7. Rule Health Snapshot (TERM-007 at 37.5% override rate)
    term007_snapshot = (
        db.query(RuleHealthSnapshot)
        .filter(
            RuleHealthSnapshot.workspace_id == workspace.id,
            RuleHealthSnapshot.rule_code == "TERM-007",
        )
        .first()
    )
    if not term007_snapshot:
        term007_snapshot = RuleHealthSnapshot(
            workspace_id=workspace.id,
            rule_code="TERM-007",
            snapshot_date=datetime.now(UTC),
            total_evaluations=24,
            total_flags=24,
            total_overrides=9,
            override_rate=0.375,  # 9 / 24 = 37.5%
            diagnostic_status="SCOPE_MISMATCH",
            primary_override_reason="JUSTIFIED_EDUCATIONAL_CONTEXT",
        )
        db.add(term007_snapshot)
        db.flush()
        logger.info("Seeded RuleHealthSnapshot for TERM-007 (37.5% override rate)")

    # 8. Seeded Deterministic Proposal (PROP-01)
    proposal_path = DATA_DIR / "demo_policy" / "seeded_proposal.json"
    if proposal_path.exists():
        prop_data = json.loads(proposal_path.read_text(encoding="utf-8"))
        prop = (
            db.query(RuleChangeProposal)
            .filter(
                RuleChangeProposal.workspace_id == workspace.id,
                RuleChangeProposal.proposal_code == "PROP-01",
            )
            .first()
        )
        if not prop:
            prop = RuleChangeProposal(
                id=PROPOSAL_PROP01_ID,
                workspace_id=workspace.id,
                proposal_code="PROP-01",
                policy_version_id=policy_v1.id,
                target_rule_code=prop_data.get("target_rule_code", "TERM-007"),
                title=prop_data.get("title", ""),
                rationale=prop_data.get("rationale", ""),
                proposed_diff=prop_data.get("diff", {}),
                status="DRAFT",
                created_by=BM_USER_ID,
            )
            db.add(prop)
            db.flush()

            # Backtest Run
            sim = prop_data.get("backtest_simulation", {})
            b_run = BacktestRun(
                id=BACKTEST_RUN_ID,
                workspace_id=workspace.id,
                proposal_id=prop.id,
                status="COMPLETED",
                historical_submissions_analyzed=sim.get("historical_submissions_analyzed", 24),
                prior_pass_rate=sim.get("prior_compliance_pass_rate", 0.583),
                simulated_pass_rate=sim.get("simulated_compliance_pass_rate", 0.833),
                false_positives_eliminated=sim.get("false_positives_eliminated", 6),
                regressions_detected=sim.get("regressions_detected", 0),
                safety_score=sim.get("safety_score", 1.0),
                recommendation=sim.get("recommendation", "SAFE_FOR_HUMAN_APPROVAL"),
                completed_at=datetime.now(UTC),
            )
            db.add(b_run)
            db.flush()
            logger.info("Seeded deterministic proposal PROP-01 and backtest simulation")

    # 9. Sample Submissions
    samples_path = DATA_DIR / "demo_submissions" / "samples.json"
    if samples_path.exists():
        samples = json.loads(samples_path.read_text(encoding="utf-8")).get("samples", [])
        for s in samples:
            title = s["title"]
            existing_sub = (
                db.query(Submission)
                .filter(
                    Submission.workspace_id == workspace.id,
                    Submission.title == title,
                )
                .first()
            )
            if not existing_sub:
                sub = Submission(
                    workspace_id=workspace.id,
                    creator_id=CREATOR_USER_ID,
                    title=title,
                    channel=s.get("channel", "web_landing_page"),
                    current_version_number=1,
                    status="DRAFT",
                )
                db.add(sub)
                db.flush()

                _norm_text, offset_map = normalize_text(s["content"])
                words = len(s["content"].split())
                chars = len(s["content"])

                sub_ver = SubmissionVersion(
                    workspace_id=workspace.id,
                    submission_id=sub.id,
                    version_number=1,
                    content=s["content"],
                    word_count=words,
                    character_count=chars,
                    offset_map=offset_map,
                )
                db.add(sub_ver)
        db.flush()
        logger.info("Configured %d sample demo submissions.", len(samples))

    db.commit()
    logger.info("Seed execution completed successfully!")

    return {
        "workspace_id": str(workspace.id),
        "policy_id": str(policy_v1.id),
        "rules_count": len(rules_data),
        "claims_count": len(claims_data),
        "users_count": len(users_data),
        "reason_codes_count": len(STANDARD_REASON_CODES),
    }


def main():
    """CLI entrypoint."""
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    db = SessionLocal()
    try:
        res = seed(db)
        print("Seed Complete:", json.dumps(res, indent=2))
    finally:
        db.close()


if __name__ == "__main__":
    main()
