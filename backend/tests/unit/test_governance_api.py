"""Unit and API tests for governance intelligence, proposal backtesting, and human Policy v1.1 adoption."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db, set_tenant_context
from app.main import app
from app.models.audit import AuditLog
from app.models.policy import PolicyVersion
from app.models.workspace import User, Workspace
from scripts.seed_data import seed

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture
def client_and_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestSessionLocal()

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    seed(db)

    client = TestClient(app)
    yield client, db
    db.close()
    Base.metadata.drop_all(bind=test_engine)
    app.dependency_overrides.clear()


def test_rule_health_diagnostics_term007(client_and_db):
    client, _db = client_and_db
    # Login as reviewer
    client.post(
        "/api/v1/auth/login",
        json={"email": "reviewer@acme.corp", "password": "Reviewer2026!"},
    )

    res = client.get("/api/v1/governance/health")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    term007 = next((item for item in data if item["rule_code"] == "TERM-007"), None)
    assert term007 is not None
    assert term007["override_rate"] == 0.375
    assert term007["diagnostic_status"] == "SCOPE_MISMATCH"


def test_list_proposals_contains_seeded_prop01(client_and_db):
    client, _db = client_and_db
    client.post(
        "/api/v1/auth/login",
        json={"email": "reviewer@acme.corp", "password": "Reviewer2026!"},
    )

    res = client.get("/api/v1/governance/proposals")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    prop = data[0]
    assert prop["proposal_code"] == "PROP-01"
    assert prop["target_rule_code"] == "TERM-007"
    assert "diff" in prop or "proposed_diff" in prop


def test_proposal_backtest_simulation(client_and_db):
    client, _db = client_and_db
    client.post(
        "/api/v1/auth/login",
        json={"email": "reviewer@acme.corp", "password": "Reviewer2026!"},
    )

    proposals_res = client.get("/api/v1/governance/proposals")
    prop_id = proposals_res.json()[0]["id"]

    res = client.post(f"/api/v1/governance/proposals/{prop_id}/backtest")
    assert res.status_code == 200
    data = res.json()
    assert data["proposal_id"] == prop_id
    assert data["status"] == "COMPLETED"
    assert data["regressions_detected"] == 0
    assert data["safety_score"] == 1.0
    assert data["recommendation"] == "SAFE_FOR_HUMAN_APPROVAL"
    assert data["simulated_pass_rate"] > data["prior_pass_rate"]


def test_creator_or_reviewer_cannot_adopt_policy_v1_1(client_and_db):
    client, _db = client_and_db
    # Reviewer attempts to adopt proposal -> Forbidden
    client.post(
        "/api/v1/auth/login",
        json={"email": "reviewer@acme.corp", "password": "Reviewer2026!"},
    )

    proposals_res = client.get("/api/v1/governance/proposals")
    prop_id = proposals_res.json()[0]["id"]

    res = client.post(f"/api/v1/governance/proposals/{prop_id}/adopt")
    assert res.status_code == 403  # Requires brand_manager


def test_brand_manager_human_adoption_creates_policy_v1_1_and_audit_log(client_and_db):
    """
    Core Acceptance Test (JRN-06, TST-14):
    Policy v1.1 is created ONLY on explicit human Brand Manager approval.
    """
    client, db = client_and_db
    ws = db.query(Workspace).filter(Workspace.slug == "acme-corp").first()
    set_tenant_context(db, str(ws.id))

    # Verify initial active policy is v1.0
    initial_active = (
        db.query(PolicyVersion)
        .filter(PolicyVersion.workspace_id == ws.id, PolicyVersion.status == "ACTIVE")
        .first()
    )
    assert initial_active is not None
    assert initial_active.version_number == "1.0"

    # Login as Brand Manager
    client.post(
        "/api/v1/auth/login",
        json={"email": "brand_manager@acme.corp", "password": "BrandManager2026!"},
    )

    bm_user = db.query(User).filter(User.email == "brand_manager@acme.corp").first()

    proposals_res = client.get("/api/v1/governance/proposals")
    prop_id = proposals_res.json()[0]["id"]

    # Explicit Human Adoption Click
    adopt_res = client.post(f"/api/v1/governance/proposals/{prop_id}/adopt")
    assert adopt_res.status_code == 200
    data = adopt_res.json()
    assert data["version_number"] == "1.1"
    assert data["status"] == "ACTIVE"
    assert data["approved_by"] == str(bm_user.id)

    # Verify Database Invariants
    db.refresh(initial_active)
    assert initial_active.status == "ARCHIVED"  # v1.0 is archived

    v1_1 = (
        db.query(PolicyVersion)
        .filter(PolicyVersion.workspace_id == ws.id, PolicyVersion.version_number == "1.1")
        .first()
    )
    assert v1_1 is not None
    assert v1_1.status == "ACTIVE"
    assert v1_1.approved_by == bm_user.id  # Human approver
    assert v1_1.approved_at is not None

    # Verify AuditLog Entry
    audit = (
        db.query(AuditLog)
        .filter(
            AuditLog.entity_id == v1_1.id,
            AuditLog.action == "POLICY_ADOPT_V1_1",
        )
        .first()
    )
    assert audit is not None
    assert audit.actor_id == bm_user.id
    assert audit.new_state["active_version"] == "1.1"


def test_transparency_disclosure_endpoint(client_and_db):
    client, _db = client_and_db
    client.post(
        "/api/v1/auth/login",
        json={"email": "reviewer@acme.corp", "password": "Reviewer2026!"},
    )

    res = client.get("/api/v1/transparency/disclosure")
    assert res.status_code == 200
    data = res.json()
    assert "total_calls_24h" in data
    assert "primary_provider" in data
    assert "FR-14 declared not built" in data["redaction_mode"]
    assert "unverified in M1 (see VER-04)" in data["retention_policy_note"]


def test_get_active_policy_endpoint(client_and_db):
    """Verify GET /governance/policy/active returns active Policy v1.0, rules, and claims."""
    client, _db = client_and_db
    client.post(
        "/api/v1/auth/login",
        json={"email": "creator@acme.corp", "password": "Creator2026!"},
    )

    res = client.get("/api/v1/governance/policy/active")
    assert res.status_code == 200
    data = res.json()
    assert data["version_number"] == "1.0"
    assert data["status"] == "ACTIVE"
    assert data["compiled_rules_count"] >= 10
    assert len(data["rules"]) >= 10
    assert len(data["approved_claims"]) >= 2

    # Verify rule structure contains double-receipt citation metadata
    rule_term001 = next((r for r in data["rules"] if r["rule_code"] == "TERM-001"), None)
    assert rule_term001 is not None
    assert rule_term001["severity"] == "CRITICAL"
    assert "bank" in rule_term001["pattern_or_term"].lower()
    assert "exact_quote" in rule_term001["source_citation"]

    # Verify claim contains temporal ledger validity
    claim_001 = next((c for c in data["approved_claims"] if c["claim_code"] == "CLAIM-001"), None)
    assert claim_001 is not None
    assert "valid_until" in claim_001
    assert "99.99%" in claim_001["claim_text"]


def test_live_override_dynamically_updates_rule_health(client_and_db):
    """
    Verifies that live human reviewer overrides immediately and dynamically
    recalculate rule health diagnostics without needing manual batch jobs.
    """
    client, _ = client_and_db

    # Login as reviewer
    client.post(
        "/api/v1/auth/login",
        json={"email": "reviewer@acme.corp", "password": "Reviewer2026!"},
    )

    # 1. Trigger check on flawed submission
    submissions_res = client.get("/api/v1/submissions")
    flawed_sub = next(s for s in submissions_res.json()["items"] if "Violations" in s["title"])
    check_res = client.post(f"/api/v1/submissions/{flawed_sub['id']}/check")
    assert check_res.status_code == 200
    findings = check_res.json()["findings"]
    term001_finding = next(f for f in findings if f["rule_code"] == "TERM-001")

    # 2. Record human reviewer override on TERM-001
    override_res = client.post(
        f"/api/v1/findings/{term001_finding['id']}/override",
        json={
            "reason_code": "APPROVED_EXCEPTION",
            "justification": "Approved under live reviewer test exception for marketing testing.",
        },
    )
    assert override_res.status_code == 201

    # 3. Query Rule Health - TERM-001 should now be dynamically included with 100% override rate
    health_res = client.get("/api/v1/governance/health")
    assert health_res.status_code == 200
    health_data = health_res.json()

    term001_health = next((h for h in health_data if h["rule_code"] == "TERM-001"), None)
    assert term001_health is not None
    assert term001_health["total_flags"] >= 1
    assert term001_health["total_overrides"] >= 1
    assert term001_health["override_rate"] == 1.0
    assert term001_health["diagnostic_status"] == "HIGH_FRICTION_CANDIDATE_FOR_REVISION"
    assert term001_health["primary_override_reason"] == "APPROVED_EXCEPTION"


def test_benchmark_endpoint_evaluates_30_cases_with_high_accuracy(client_and_db):
    """
    Verifies that the reproducible benchmark endpoint executes across all 30 test cases,
    blocks 10/10 adversarial prompt injections, and returns verified metrics.
    """
    client, _ = client_and_db

    # Login as brand manager
    client.post(
        "/api/v1/auth/login",
        json={"email": "brand_manager@acme.corp", "password": "BrandManager2026!"},
    )

    res = client.get("/api/v1/governance/benchmark")
    assert res.status_code == 200
    data = res.json()

    assert data["total_cases"] == 30
    assert len(data["cases"]) == 30
    metrics = data["metrics"]

    # Security verification
    assert metrics["adversarial_total"] == 10
    assert metrics["adversarial_blocked_count"] == 10
    assert metrics["adversarial_defense_rate"] == 1.0

    # Metric bounds
    assert metrics["f1_score"] >= 0.95
    assert metrics["precision"] >= 0.95
    assert metrics["recall"] >= 0.95
    assert metrics["accuracy"] >= 0.95
    assert metrics["avg_latency_ms"] < 50.0  # Empirical fast pass <50ms

