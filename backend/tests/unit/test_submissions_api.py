"""Unit tests for the Submissions Drafts and Revisions API."""

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import get_db
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.base import Base
from app.models.check import CheckRun, Finding
from app.models.policy import PolicyVersion, SourceDocument
from app.models.workspace import User, Workspace

TEST_WORKSPACE_ID = uuid.UUID("0192e850-89ab-7d31-b6a4-22b6ffbfb3b1")
TEST_CREATOR_ID = uuid.UUID("0192e850-89ab-7d31-b6a4-22b6ffbfb3b2")
TEST_REVIEWER_ID = uuid.UUID("0192e850-89ab-7d31-b6a4-22b6ffbfb3b3")
TEST_BM_ID = uuid.UUID("0192e850-89ab-7d31-b6a4-22b6ffbfb3b4")

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    session = TestSessionLocal()
    wks = Workspace(id=TEST_WORKSPACE_ID, name="Acme Corp", slug="acme-corp")
    session.add(wks)
    session.commit()

    creator = User(
        id=TEST_CREATOR_ID,
        workspace_id=TEST_WORKSPACE_ID,
        email="creator@example.com",
        password_hash=hash_password("Pass123!"),
        full_name="Charlie Creator",
        role="creator",
        is_active=True,
    )
    reviewer = User(
        id=TEST_REVIEWER_ID,
        workspace_id=TEST_WORKSPACE_ID,
        email="reviewer@example.com",
        password_hash=hash_password("Pass123!"),
        full_name="Rachel Reviewer",
        role="reviewer",
        is_active=True,
    )
    bm = User(
        id=TEST_BM_ID,
        workspace_id=TEST_WORKSPACE_ID,
        email="bm@example.com",
        password_hash=hash_password("Pass123!"),
        full_name="Brenda BrandManager",
        role="brand_manager",
        is_active=True,
    )
    session.add_all([creator, reviewer, bm])
    session.commit()
    session.close()

    yield

    Base.metadata.drop_all(bind=test_engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def creator_token():
    return create_access_token(
        {
            "sub": str(TEST_CREATOR_ID),
            "workspace_id": str(TEST_WORKSPACE_ID),
            "role": "creator",
            "email": "creator@example.com",
        }
    )


@pytest.fixture
def reviewer_token():
    return create_access_token(
        {
            "sub": str(TEST_REVIEWER_ID),
            "workspace_id": str(TEST_WORKSPACE_ID),
            "role": "reviewer",
            "email": "reviewer@example.com",
        }
    )


def test_create_submission_and_revision_flow(client, creator_token):
    headers = {"Authorization": f"Bearer {creator_token}"}

    # 1. Create Draft
    create_payload = {
        "title": "Spring Launch Landing Page Copy",
        "channel": "web_landing_page",
        "content": "Acme is a modern financial platform offering competitive yields.",
    }
    res = client.post("/api/v1/submissions", json=create_payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Spring Launch Landing Page Copy"
    assert data["channel"] == "web_landing_page"
    assert data["current_version_number"] == 1
    assert data["status"] == "DRAFT"
    assert data["current_version"] is not None
    assert data["current_version"]["word_count"] == 9
    sub_id = data["id"]

    # 2. List Submissions
    list_res = client.get("/api/v1/submissions", headers=headers)
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 1
    assert any(item["id"] == sub_id for item in list_data["items"])

    # 3. Get Details
    get_res = client.get(f"/api/v1/submissions/{sub_id}", headers=headers)
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["id"] == sub_id
    assert len(get_data["versions"]) == 1

    # 4. Add Revision Version 2
    rev_payload = {
        "content": "Acme is a modern financial platform offering verified FDIC-insured solutions.",
    }
    rev_res = client.post(
        f"/api/v1/submissions/{sub_id}/versions", json=rev_payload, headers=headers
    )
    assert rev_res.status_code == 201
    rev_data = rev_res.json()
    assert rev_data["current_version_number"] == 2
    assert len(rev_data["versions"]) == 2
    assert rev_data["current_version"]["version_number"] == 2
    assert "FDIC-insured" in rev_data["current_version"]["content"]


def test_get_nonexistent_submission_404(client, creator_token):
    headers = {"Authorization": f"Bearer {creator_token}"}
    fake_id = uuid.uuid4()
    res = client.get(f"/api/v1/submissions/{fake_id}", headers=headers)
    assert res.status_code == 404
    body = res.json()
    assert body["error"]["code"] == "SUBMISSION_NOT_FOUND"


def test_unauthorized_submissions_access(client):
    res = client.get("/api/v1/submissions")
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "UNAUTHORIZED"


def test_creator_cannot_approve_or_send_back(client, creator_token):
    headers = {"Authorization": f"Bearer {creator_token}"}
    create_res = client.post(
        "/api/v1/submissions",
        json={"title": "Test Draft", "content": "Sample content"},
        headers=headers,
    )
    assert create_res.status_code == 201
    sub_id = create_res.json()["id"]

    # Creator cannot approve
    app_res = client.post(f"/api/v1/submissions/{sub_id}/approve", json={"notes": "Trying to self-approve"}, headers=headers)
    assert app_res.status_code == 403
    assert app_res.json()["error"]["code"] == "FORBIDDEN"

    # Creator cannot send back
    sb_res = client.post(f"/api/v1/submissions/{sub_id}/send-back", json={"notes": "Trying to send back"}, headers=headers)
    assert sb_res.status_code == 403
    assert sb_res.json()["error"]["code"] == "FORBIDDEN"


def test_approver_cannot_approve_with_open_critical_findings(client, creator_token, reviewer_token):
    creator_headers = {"Authorization": f"Bearer {creator_token}"}
    reviewer_headers = {"Authorization": f"Bearer {reviewer_token}"}

    create_res = client.post(
        "/api/v1/submissions",
        json={"title": "Draft with Critical Violation", "content": "Bad prohibited text"},
        headers=creator_headers,
    )
    assert create_res.status_code == 201
    sub_id = uuid.UUID(create_res.json()["id"])
    ver_id = uuid.UUID(create_res.json()["current_version"]["id"])

    # Seed an open CRITICAL finding into test database
    session = TestSessionLocal()
    doc = SourceDocument(
        id=uuid.uuid4(),
        workspace_id=TEST_WORKSPACE_ID,
        title="Guide 1",
        storage_path="/docs/1",
        content_hash="a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
        extracted_text="text",
        uploaded_by=TEST_CREATOR_ID,
    )
    pol = PolicyVersion(
        id=uuid.uuid4(),
        workspace_id=TEST_WORKSPACE_ID,
        source_document_id=doc.id,
        version_number="1.0",
        created_by=TEST_CREATOR_ID,
        approved_by=TEST_BM_ID,
        status="ACTIVE",
    )
    cr = CheckRun(
        id=uuid.uuid4(),
        workspace_id=TEST_WORKSPACE_ID,
        submission_id=sub_id,
        submission_version_id=ver_id,
        policy_version_id=pol.id,
        status="COMPLETED",
        total_findings=1,
    )
    f = Finding(
        id=uuid.uuid4(),
        workspace_id=TEST_WORKSPACE_ID,
        check_run_id=cr.id,
        rule_code="CLAIM-001",
        category="CLAIMS",
        severity="CRITICAL",
        title="Unsubstantiated Claim",
        matched_text="bad text",
        start_offset=0,
        end_offset=8,
        receipt_a_draft_span="bad text",
        receipt_b_rule_quote="prohibited quote",
        source_document_title="Guide 1",
        source_section="Sec 1",
        status="PENDING_REVIEW",
    )
    session.add_all([doc, pol, cr, f])
    session.commit()
    session.close()

    # Attempt sign-off by reviewer -> must be blocked
    approve_res = client.post(
        f"/api/v1/submissions/{sub_id}/approve",
        json={"notes": "Approving despite critical finding"},
        headers=reviewer_headers,
    )
    assert approve_res.status_code == 400
    err = approve_res.json()
    assert err["error"]["code"] == "CRITICAL_FINDINGS_UNRESOLVED"
    assert "CLAIM-001" in err["error"]["message"]


def test_approver_signoff_clean_submission_success(client, creator_token, reviewer_token):
    creator_headers = {"Authorization": f"Bearer {creator_token}"}
    reviewer_headers = {"Authorization": f"Bearer {reviewer_token}"}

    create_res = client.post(
        "/api/v1/submissions",
        json={"title": "Compliant Production Copy", "content": "Acme provides enterprise banking tools."},
        headers=creator_headers,
    )
    assert create_res.status_code == 201
    sub_id = create_res.json()["id"]

    # Reviewer grants sign-off
    approve_res = client.post(
        f"/api/v1/submissions/{sub_id}/approve",
        json={"notes": "Legal and Brand approved for Q4 launch", "approval_type": "FINAL_SIGNOFF"},
        headers=reviewer_headers,
    )
    assert approve_res.status_code == 200
    data = approve_res.json()
    assert data["status"] == "APPROVED"
    assert data["latest_approval"] is not None
    assert data["latest_approval"]["decision"] == "APPROVED"
    assert data["latest_approval"]["notes"] == "Legal and Brand approved for Q4 launch"
    assert data["latest_approval"]["approved_by"] == str(TEST_REVIEWER_ID)
    assert data["latest_approval"]["approver_name"] == "Rachel Reviewer"


def test_approver_send_back_loop(client, creator_token, reviewer_token):
    creator_headers = {"Authorization": f"Bearer {creator_token}"}
    reviewer_headers = {"Authorization": f"Bearer {reviewer_token}"}

    create_res = client.post(
        "/api/v1/submissions",
        json={"title": "Draft Requiring Revisions", "content": "Preliminary draft content."},
        headers=creator_headers,
    )
    assert create_res.status_code == 201
    sub_id = create_res.json()["id"]

    # Send back with notes < 5 chars -> rejected by validation
    short_res = client.post(
        f"/api/v1/submissions/{sub_id}/send-back",
        json={"notes": "fix"},
        headers=reviewer_headers,
    )
    assert short_res.status_code == 422

    # Send back with proper revision notes -> success
    sb_res = client.post(
        f"/api/v1/submissions/{sub_id}/send-back",
        json={"notes": "Please soften the tone in the opening paragraph and cite FDIC partner name."},
        headers=reviewer_headers,
    )
    assert sb_res.status_code == 200
    sb_data = sb_res.json()
    assert sb_data["status"] == "SENT_BACK"
    assert sb_data["latest_approval"] is not None
    assert sb_data["latest_approval"]["decision"] == "SENT_BACK"
    assert "FDIC partner name" in sb_data["latest_approval"]["notes"]

    # List historical approvals
    hist_res = client.get(f"/api/v1/submissions/{sub_id}/approvals", headers=reviewer_headers)
    assert hist_res.status_code == 200
    hist = hist_res.json()
    assert len(hist) == 1
    assert hist[0]["decision"] == "SENT_BACK"
    assert hist[0]["approver_name"] == "Rachel Reviewer"


def test_download_compliance_release_certificate(client, creator_token, reviewer_token):
    """
    Verifies that approved submissions can export an immutable, cryptographically signed
    compliance release certificate containing content hashes, governing policy hash, and digital signature.
    """
    creator_headers = {"Authorization": f"Bearer {creator_token}"}
    reviewer_headers = {"Authorization": f"Bearer {reviewer_token}"}

    # 1. Create clean submission
    create_res = client.post(
        "/api/v1/submissions",
        json={
            "title": "Certified Q1 Campaign",
            "channel": "press_release",
            "content": "Acme delivers enterprise compliance infrastructure.",
        },
        headers=creator_headers,
    )
    assert create_res.status_code == 201
    sub_id = create_res.json()["id"]

    # 2. Approve submission
    app_res = client.post(
        f"/api/v1/submissions/{sub_id}/approve",
        json={"notes": "All checks verified and approved for corporate publication."},
        headers=reviewer_headers,
    )
    assert app_res.status_code == 200

    # 3. Export Certificate
    cert_res = client.get(f"/api/v1/submissions/{sub_id}/certificate", headers=creator_headers)
    assert cert_res.status_code == 200
    cert = cert_res.json()

    assert cert["status"] == "OFFICIALLY_CERTIFIED"
    assert "CERT-ACME" in cert["certificate_id"]
    assert cert["submission"]["id"] == sub_id
    assert len(cert["submission"]["content_sha256"]) == 64
    assert len(cert["governing_policy"]["document_sha256"]) == 64
    assert cert["approval_attestation"]["approver_name"] == "Rachel Reviewer"
    assert "EU AI Act Article 14" in cert["approval_attestation"]["statutory_compliance_note"]
    assert len(cert["cryptographic_verification"]["digital_signature"]) == 64

