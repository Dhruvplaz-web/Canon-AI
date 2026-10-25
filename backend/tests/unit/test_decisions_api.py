"""Unit and API tests for human reviewer decisions and override governance."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db, set_tenant_context
from app.main import app
from app.models.audit import AuditLog
from app.models.check import Finding
from app.models.submission import Submission
from app.models.workspace import Workspace
from app.services.pipeline_runner import run_check_pipeline
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


def test_list_reason_codes(client_and_db):
    client, _db = client_and_db
    # Login as reviewer
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "reviewer@acme.corp", "password": "Reviewer2026!"},
    )
    assert login_res.status_code == 200

    res = client.get("/api/v1/governance/reason-codes")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 5
    codes = {item["code"] for item in data}
    assert "SCOPE_MISMATCH" in codes
    assert "APPROVED_CAMPAIGN_EXCEPTION" in codes


def test_creator_cannot_override_finding(client_and_db):
    client, db = client_and_db
    ws = db.query(Workspace).filter(Workspace.slug == "acme-corp").first()
    set_tenant_context(db, str(ws.id))

    # Run check pipeline on SUB-02 to generate findings
    sub2 = (
        db.query(Submission)
        .filter(Submission.title.contains("4 Violations"))
        .first()
    )
    assert sub2 is not None
    check_run = run_check_pipeline(db, sub2.id)
    finding = db.query(Finding).filter(Finding.check_run_id == check_run.id).first()
    assert finding is not None

    # Login as creator (Creator cannot override)
    client.post(
        "/api/v1/auth/login",
        json={"email": "creator@acme.corp", "password": "Creator2026!"},
    )

    override_res = client.post(
        f"/api/v1/findings/{finding.id}/override",
        json={
            "reason_code": "SCOPE_MISMATCH",
            "justification": "This is an internal partner document not public.",
        },
    )
    assert override_res.status_code == 403


def test_reviewer_override_finding_creates_audit_log(client_and_db):
    client, db = client_and_db
    ws = db.query(Workspace).filter(Workspace.slug == "acme-corp").first()
    set_tenant_context(db, str(ws.id))

    # Run check pipeline on SUB-02
    sub2 = (
        db.query(Submission)
        .filter(Submission.title.contains("4 Violations"))
        .first()
    )
    assert sub2 is not None
    check_run = run_check_pipeline(db, sub2.id)
    finding = db.query(Finding).filter(Finding.check_run_id == check_run.id).first()
    assert finding is not None

    # Login as reviewer
    client.post(
        "/api/v1/auth/login",
        json={"email": "reviewer@acme.corp", "password": "Reviewer2026!"},
    )

    override_payload = {
        "reason_code": "SCOPE_MISMATCH",
        "justification": "Internal partner documentation exception approved by VP Brand.",
    }
    res = client.post(f"/api/v1/findings/{finding.id}/override", json=override_payload)
    assert res.status_code == 201
    data = res.json()
    assert data["finding_id"] == str(finding.id)
    assert data["reason_code"] == "SCOPE_MISMATCH"
    assert data["decision_type"] == "OVERRIDE"

    # Verify Finding updated in DB
    db.refresh(finding)
    assert finding.status == "OVERRIDDEN"

    # Verify AuditLog created
    audit = (
        db.query(AuditLog)
        .filter(
            AuditLog.entity_id == finding.id,
            AuditLog.action == "FINDING_OVERRIDE",
        )
        .first()
    )
    assert audit is not None
    assert audit.new_state["reason_code"] == "SCOPE_MISMATCH"
    assert audit.new_state["status"] == "OVERRIDDEN"

    # Verify cannot override twice (idempotency/conflict check)
    dup_res = client.post(f"/api/v1/findings/{finding.id}/override", json=override_payload)
    assert dup_res.status_code == 409
