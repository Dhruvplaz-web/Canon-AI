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


def test_review_queue_pushdown_filtering_and_pagination(client_and_db):
    """Verifies PROP-U08: review queue pushdown SQL filtering and pagination."""
    client, db = client_and_db
    ws = db.query(Workspace).filter(Workspace.slug == "acme-corp").first()
    set_tenant_context(db, str(ws.id))

    # Run check pipeline on SUB-02 to generate 4 findings
    sub2 = db.query(Submission).filter(Submission.title.contains("4 Violations")).first()
    assert sub2 is not None
    run_check_pipeline(db, sub2.id)

    # Login as reviewer
    client.post(
        "/api/v1/auth/login",
        json={"email": "reviewer@acme.corp", "password": "Reviewer2026!"},
    )

    # 1. Base queue listing
    queue_res = client.get("/api/v1/review/queue")
    assert queue_res.status_code == 200
    data = queue_res.json()
    assert data["total"] == 4
    assert len(data["items"]) == 4
    assert data["page"] == 1
    assert data["total_pages"] == 1

    # Check item schema
    item = data["items"][0]
    assert "submission_title" in item
    assert "submission_channel" in item
    assert "rule_code" in item
    assert "receipt_a_draft_span" in item
    assert "receipt_b_rule_quote" in item

    # 2. Pushdown filter by severity
    crit_res = client.get("/api/v1/review/queue?severity=CRITICAL")
    assert crit_res.status_code == 200
    crit_data = crit_res.json()
    assert all(i["severity"] == "CRITICAL" for i in crit_data["items"])
    assert crit_data["total"] >= 1

    # 3. Pushdown filter by channel
    email_res = client.get("/api/v1/review/queue?channel=email_blast")
    assert email_res.status_code == 200
    assert email_res.json()["total"] == 4

    web_res = client.get("/api/v1/review/queue?channel=web_landing_page")
    assert web_res.status_code == 200
    assert web_res.json()["total"] == 0

    # 4. Pushdown search filter
    search_res = client.get("/api/v1/review/queue?search=dope")
    assert search_res.status_code == 200
    assert search_res.json()["total"] == 1
    assert "dope" in search_res.json()["items"][0]["matched_text"].lower()

    # 5. Pushdown pagination
    paged_res = client.get("/api/v1/review/queue?page=1&page_size=2")
    assert paged_res.status_code == 200
    paged_data = paged_res.json()
    assert paged_data["total"] == 4
    assert len(paged_data["items"]) == 2
    assert paged_data["page"] == 1
    assert paged_data["page_size"] == 2
    assert paged_data["total_pages"] == 2


def test_batch_override_findings_workflow(client_and_db):
    """Verifies PROP-U08: atomic batch override with mandatory reason code and audit logging."""
    client, db = client_and_db
    ws = db.query(Workspace).filter(Workspace.slug == "acme-corp").first()
    set_tenant_context(db, str(ws.id))

    # Run check pipeline on SUB-02
    sub2 = db.query(Submission).filter(Submission.title.contains("4 Violations")).first()
    assert sub2 is not None
    check_run = run_check_pipeline(db, sub2.id)
    findings = db.query(Finding).filter(Finding.check_run_id == check_run.id).all()
    assert len(findings) == 4

    target_ids = [str(findings[0].id), str(findings[1].id)]

    # 1. Creator cannot perform batch override
    client.post(
        "/api/v1/auth/login",
        json={"email": "creator@acme.corp", "password": "Creator2026!"},
    )
    unauth_res = client.post(
        "/api/v1/review/batch-override",
        json={
            "finding_ids": target_ids,
            "reason_code": "APPROVED_EXCEPTION",
            "justification": "Creator self-approving exception.",
        },
    )
    assert unauth_res.status_code == 403

    # 2. Reviewer executes batch override
    client.post(
        "/api/v1/auth/login",
        json={"email": "reviewer@acme.corp", "password": "Reviewer2026!"},
    )
    batch_res = client.post(
        "/api/v1/review/batch-override",
        json={
            "finding_ids": target_ids,
            "reason_code": "APPROVED_EXCEPTION",
            "justification": "Reviewed and batch-approved exception by editorial team.",
        },
    )
    assert batch_res.status_code == 200
    batch_data = batch_res.json()
    assert batch_data["overridden_count"] == 2
    assert set(batch_data["affected_finding_ids"]) == set(target_ids)
    assert batch_data["reason_code"] == "APPROVED_EXCEPTION"

    # 3. Verify Database state: status is OVERRIDDEN
    for fid in target_ids:
        f = db.query(Finding).filter(Finding.id == fid).first()
        assert f.status == "OVERRIDDEN"

        # Verify individual AuditLog entry exists
        audit = (
            db.query(AuditLog)
            .filter(AuditLog.entity_id == fid, AuditLog.action == "FINDING_OVERRIDE")
            .first()
        )
        assert audit is not None
        assert audit.new_state["reason_code"] == "APPROVED_EXCEPTION"
        assert audit.new_state.get("batch") is True

