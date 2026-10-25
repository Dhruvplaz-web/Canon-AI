"""Unit tests for authentication, password hashing, JWT, and RBAC guards."""

import uuid

import pytest
from fastapi import Depends
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.v1.auth import require_role
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.main import app
from app.models.base import Base
from app.models.workspace import User, Workspace

TEST_WORKSPACE_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
TEST_BM_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")
TEST_CREATOR_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000003")

# In-memory SQLite DB for isolated auth testing
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
    # Create test workspace and users
    workspace = Workspace(
        id=TEST_WORKSPACE_ID,
        name="Acme Corp Test",
        slug="acme-test",
    )
    session.add(workspace)
    session.commit()

    brand_manager = User(
        id=TEST_BM_USER_ID,
        workspace_id=TEST_WORKSPACE_ID,
        email="bm@example.com",
        password_hash=hash_password("SuperSecret123!"),
        full_name="Alice Brand Manager",
        role="brand_manager",
        is_active=True,
    )
    creator = User(
        id=TEST_CREATOR_USER_ID,
        workspace_id=TEST_WORKSPACE_ID,
        email="creator@example.com",
        password_hash=hash_password("CreatorPass123!"),
        full_name="Bob Creator",
        role="creator",
        is_active=True,
    )
    session.add_all([brand_manager, creator])
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


def test_password_hashing():
    raw_pass = "SecurePassphrase!42"
    hashed = hash_password(raw_pass)
    assert hashed != raw_pass
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_jwt_token_cycle():
    u_id = str(uuid.uuid4())
    w_id = str(uuid.uuid4())
    data = {
        "sub": u_id,
        "workspace_id": w_id,
        "role": "brand_manager",
        "email": "test@canon.test",
    }
    token = create_access_token(data)
    decoded = decode_access_token(token)
    assert decoded["sub"] == u_id
    assert decoded["workspace_id"] == w_id
    assert decoded["role"] == "brand_manager"
    assert "exp" in decoded


def test_login_success_and_cookie(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "bm@example.com", "password": "SuperSecret123!"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == "bm@example.com"
    assert body["user"]["role"] == "brand_manager"

    # Verify httpOnly cookie is set
    assert "access_token" in response.cookies
    cookie_val = response.cookies["access_token"]
    assert cookie_val == body["access_token"]


def test_login_invalid_credentials(client):
    # Wrong password
    res1 = client.post(
        "/api/v1/auth/login",
        json={"email": "bm@example.com", "password": "WrongPassword!"},
    )
    assert res1.status_code == 401
    err1 = res1.json()["error"]
    assert err1["code"] == "INVALID_CREDENTIALS"

    # Non-existent user
    res2 = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "WrongPassword!"},
    )
    assert res2.status_code == 401
    err2 = res2.json()["error"]
    assert err2["code"] == "INVALID_CREDENTIALS"


def test_get_me_with_cookie(client):
    # Login first
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "bm@example.com", "password": "SuperSecret123!"},
    )
    token = login_res.json()["access_token"]

    # Request /me using cookie
    client.cookies.set("access_token", token)
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 200
    assert res.json()["email"] == "bm@example.com"
    assert res.json()["role"] == "brand_manager"


def test_get_me_with_bearer_header(client):
    token = create_access_token(
        {
            "sub": str(TEST_CREATOR_USER_ID),
            "workspace_id": str(TEST_WORKSPACE_ID),
            "role": "creator",
            "email": "creator@example.com",
        }
    )
    client.cookies.clear()
    res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["email"] == "creator@example.com"
    assert res.json()["role"] == "creator"


def test_get_me_unauthorized(client):
    client.cookies.clear()
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "UNAUTHORIZED"

    # Invalid token
    res_inv = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.fake.token"},
    )
    assert res_inv.status_code == 401
    assert res_inv.json()["error"]["code"] == "INVALID_TOKEN"


def test_require_role_guard(client):
    # Add temporary test route with role guard
    @app.get("/api/v1/test/bm-only", tags=["Test"])
    def bm_only_route(user=Depends(require_role("brand_manager"))):
        return {"ok": True, "user_id": str(user.id)}

    # Brand manager token (allowed)
    bm_token = create_access_token(
        {
            "sub": str(TEST_BM_USER_ID),
            "workspace_id": str(TEST_WORKSPACE_ID),
            "role": "brand_manager",
            "email": "bm@example.com",
        }
    )
    res_bm = client.get(
        "/api/v1/test/bm-only",
        headers={"Authorization": f"Bearer {bm_token}"},
    )
    assert res_bm.status_code == 200
    assert res_bm.json()["ok"] is True

    # Creator token (forbidden)
    creator_token = create_access_token(
        {
            "sub": str(TEST_CREATOR_USER_ID),
            "workspace_id": str(TEST_WORKSPACE_ID),
            "role": "creator",
            "email": "creator@example.com",
        }
    )
    res_cr = client.get(
        "/api/v1/test/bm-only",
        headers={"Authorization": f"Bearer {creator_token}"},
    )
    assert res_cr.status_code == 403
    assert res_cr.json()["error"]["code"] == "FORBIDDEN"


def test_logout_clears_cookie(client):
    client.cookies.set("access_token", "dummy_token")
    res = client.post("/api/v1/auth/logout")
    assert res.status_code == 200
    assert res.json()["status"] == "logged_out"
