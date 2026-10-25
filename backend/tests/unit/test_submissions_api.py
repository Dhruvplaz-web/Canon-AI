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
from app.models.workspace import User, Workspace

TEST_WORKSPACE_ID = uuid.UUID("0192e850-89ab-7d31-b6a4-22b6ffbfb3b1")
TEST_CREATOR_ID = uuid.UUID("0192e850-89ab-7d31-b6a4-22b6ffbfb3b2")

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
    session.add(creator)
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
