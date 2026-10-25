"""Unit tests for the In-Process Verification Pipeline Runner and API check execution."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import get_db
from app.core.security import create_access_token
from app.main import app
from app.models.base import Base
from app.models.check import Finding
from app.models.submission import Submission, SubmissionVersion
from app.models.workspace import User
from app.services.pipeline_runner import run_check_pipeline
from scripts.seed_data import seed

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
SAMPLES_PATH = REPO_ROOT / "data" / "demo_submissions" / "samples.json"

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(autouse=True)
def setup_seeded_db():
    Base.metadata.create_all(bind=test_engine)
    session = TestSessionLocal()
    seed(session)
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
def creator_headers():
    session = TestSessionLocal()
    creator = session.query(User).filter(User.role == "creator").first()
    token = create_access_token(
        {
            "sub": str(creator.id),
            "workspace_id": str(creator.workspace_id),
            "role": "creator",
            "email": creator.email,
        }
    )
    session.close()
    return {"Authorization": f"Bearer {token}"}


def test_pipeline_clean_submission_sub01():
    session = TestSessionLocal()
    sub01 = session.query(Submission).filter(Submission.title.contains("Clean")).first()
    assert sub01 is not None

    check_run = run_check_pipeline(session, sub01.id)

    assert check_run.status == "COMPLETED"
    assert check_run.total_findings == 0
    assert sub01.status == "APPROVED"
    session.close()


def test_pipeline_four_violations_sub02_with_double_receipts():
    session = TestSessionLocal()
    sub02 = session.query(Submission).filter(Submission.title.contains("4 Violations")).first()
    assert sub02 is not None

    check_run = run_check_pipeline(session, sub02.id)

    assert check_run.status == "COMPLETED"
    assert check_run.total_findings == 4
    assert sub02.status == "PENDING_REVIEW"

    findings = session.query(Finding).filter(Finding.check_run_id == check_run.id).all()
    assert len(findings) == 4

    rule_codes = {f.rule_code for f in findings}
    assert "TERM-001" in rule_codes  # Bank on us
    assert "TONE-002" in rule_codes  # super dope yields
    assert "TERM-004" in rule_codes  # instant loan approval
    assert "CLAIM-001" in rule_codes  # expired claim

    # Verify double-receipt invariant for every finding
    sub_ver = session.query(SubmissionVersion).filter(SubmissionVersion.id == check_run.submission_version_id).first()
    for f in findings:
        # Receipt A: Draft span matches original text at start_offset:end_offset
        extracted_draft = sub_ver.content[f.start_offset : f.end_offset]
        assert extracted_draft.lower() == f.receipt_a_draft_span.lower()
        # Receipt B: Rule quote is non-empty source citation
        assert len(f.receipt_b_rule_quote) > 0
        assert len(f.source_document_title) > 0
        assert len(f.source_section) > 0

    session.close()


def test_pipeline_adversarial_prompt_injection_sub03():
    session = TestSessionLocal()
    sub03 = session.query(Submission).filter(Submission.title.contains("Injection")).first()
    assert sub03 is not None

    check_run = run_check_pipeline(session, sub03.id)

    assert check_run.status == "COMPLETED"
    assert check_run.total_findings >= 1
    assert sub03.status == "PENDING_REVIEW"

    sec_findings = (
        session.query(Finding)
        .filter(Finding.check_run_id == check_run.id, Finding.rule_code == "SEC-INJ-001")
        .all()
    )
    assert len(sec_findings) >= 1
    assert sec_findings[0].severity == "CRITICAL"
    session.close()


def test_check_api_endpoint_flow(client, creator_headers):
    # Retrieve SUB-02 id via seeded data
    session = TestSessionLocal()
    sub02 = session.query(Submission).filter(Submission.title.contains("4 Violations")).first()
    sub_id = str(sub02.id)
    session.close()

    # Trigger POST /api/v1/submissions/{id}/check
    res = client.post(f"/api/v1/submissions/{sub_id}/check", headers=creator_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "COMPLETED"
    assert data["total_findings"] == 4
    assert len(data["findings"]) == 4

    # Verify check list endpoint GET /api/v1/submissions/{id}/checks
    list_res = client.get(f"/api/v1/submissions/{sub_id}/checks", headers=creator_headers)
    assert list_res.status_code == 200
    checks_list = list_res.json()
    assert len(checks_list) >= 1
    assert checks_list[0]["id"] == data["id"]
