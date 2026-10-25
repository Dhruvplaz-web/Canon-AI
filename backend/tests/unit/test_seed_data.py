"""Unit tests for the demo seed data script and idempotency."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.base import Base
from app.models.check import ReasonCode
from app.models.governance import BacktestRun, RuleChangeProposal, RuleHealthSnapshot
from app.models.policy import ApprovedClaim, PolicyVersion, Rule, SourceDocument
from app.models.submission import Submission, SubmissionVersion
from app.models.workspace import User, Workspace
from scripts.seed_data import seed

# Isolated in-memory SQLite database
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(autouse=True)
def setup_tables():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


def test_seed_data_execution_and_counts():
    session = TestSession()
    try:
        summary = seed(session)

        assert summary["rules_count"] == 12
        assert summary["claims_count"] == 2
        assert summary["users_count"] == 4
        assert summary["reason_codes_count"] == 12

        # Verify Workspace
        wks = session.query(Workspace).filter(Workspace.slug == "acme-corp").first()
        assert wks is not None
        assert wks.name == "Acme Corporation"

        # Verify RBAC Users
        users = session.query(User).filter(User.workspace_id == wks.id).all()
        assert len(users) == 4
        roles = {u.role for u in users}
        assert roles == {"brand_manager", "reviewer", "creator", "approver"}

        # Verify Source Document
        doc = session.query(SourceDocument).filter(SourceDocument.workspace_id == wks.id).first()
        assert doc is not None
        assert doc.status == "PARSED"

        # Verify Policy Version v1.0
        policy = (
            session.query(PolicyVersion)
            .filter(
                PolicyVersion.workspace_id == wks.id,
                PolicyVersion.version_number == "1.0",
            )
            .first()
        )
        assert policy is not None
        assert policy.status == "ACTIVE"
        assert policy.approved_by is not None  # Human approval invariant

        # Verify Rules
        rules = session.query(Rule).filter(Rule.policy_version_id == policy.id).all()
        assert len(rules) == 12
        rule_codes = {r.rule_code for r in rules}
        assert "TERM-001" in rule_codes
        assert "TERM-007" in rule_codes
        assert "TONE-002" in rule_codes

        # Verify Approved Claims Ledger & Expired Claim
        claims = (
            session.query(ApprovedClaim).filter(ApprovedClaim.policy_version_id == policy.id).all()
        )
        assert len(claims) == 2
        claim_map = {c.claim_code: c for c in claims}
        assert "CLAIM-001" in claim_map
        assert claim_map["CLAIM-001"].valid_until.year == 2025  # Stale claim invariant

        # Verify Reason Codes
        rcs = session.query(ReasonCode).filter(ReasonCode.workspace_id == wks.id).all()
        assert len(rcs) == 12
        rc_codes = {r.code for r in rcs}
        assert "JUSTIFIED_EDUCATIONAL_CONTEXT" in rc_codes

        # Verify Rule Health Snapshot for TERM-007
        snapshot = (
            session.query(RuleHealthSnapshot)
            .filter(
                RuleHealthSnapshot.workspace_id == wks.id,
                RuleHealthSnapshot.rule_code == "TERM-007",
            )
            .first()
        )
        assert snapshot is not None
        assert snapshot.total_evaluations == 24
        assert snapshot.total_overrides == 9
        assert snapshot.override_rate == 0.375
        assert snapshot.diagnostic_status == "SCOPE_MISMATCH"

        # Verify Deterministic Seeded Proposal PROP-01
        prop = (
            session.query(RuleChangeProposal)
            .filter(
                RuleChangeProposal.workspace_id == wks.id,
                RuleChangeProposal.proposal_code == "PROP-01",
            )
            .first()
        )
        assert prop is not None
        assert prop.target_rule_code == "TERM-007"
        assert prop.status == "DRAFT"  # Human has NOT approved yet

        # Verify Backtest Run
        b_run = session.query(BacktestRun).filter(BacktestRun.proposal_id == prop.id).first()
        assert b_run is not None
        assert b_run.status == "COMPLETED"
        assert b_run.safety_score == 1.0

        # Verify Sample Submissions
        subs = session.query(Submission).filter(Submission.workspace_id == wks.id).all()
        assert len(subs) == 3
        sub_vers = (
            session.query(SubmissionVersion).filter(SubmissionVersion.workspace_id == wks.id).all()
        )
        assert len(sub_vers) == 3
    finally:
        session.close()


def test_seed_data_idempotency():
    """Verify running seed multiple times produces no errors and does not duplicate records."""
    session = TestSession()
    try:
        # First execution
        seed(session)
        # Second execution
        seed(session)

        # Assert no duplicate workspace
        wks_count = session.query(Workspace).filter(Workspace.slug == "acme-corp").count()
        assert wks_count == 1

        # Assert no duplicate users
        user_count = session.query(User).count()
        assert user_count == 4

        # Assert no duplicate policy versions
        policy_count = session.query(PolicyVersion).count()
        assert policy_count == 1

        # Assert no duplicate rules
        rules_count = session.query(Rule).count()
        assert rules_count == 12

        # Assert no duplicate claims
        claims_count = session.query(ApprovedClaim).count()
        assert claims_count == 2
    finally:
        session.close()
