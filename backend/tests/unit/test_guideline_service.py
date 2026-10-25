"""Unit tests for guideline text ingestion and rule compilation."""

import uuid

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.base import Base
from app.models.policy import ApprovedClaim, Rule
from app.models.workspace import User, Workspace
from app.services.guideline_service import (
    compile_policy_version,
    compute_content_hash,
    ingest_guideline_document,
)

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

TEST_WKS_ID = uuid.UUID("0192e850-89ab-7d31-b6a4-22b6ffbfb3b1")
TEST_USER_ID = uuid.UUID("0192e850-89ab-7d31-b6a4-22b6ffbfb3b2")


@pytest.fixture(autouse=True)
def setup_tables():
    Base.metadata.create_all(bind=test_engine)
    session = TestSession()
    wks = Workspace(id=TEST_WKS_ID, name="Acme", slug="acme")
    usr = User(
        id=TEST_USER_ID,
        workspace_id=TEST_WKS_ID,
        email="bm@example.com",
        password_hash="fakehash",
        full_name="Alice BM",
        role="brand_manager",
    )
    session.add_all([wks, usr])
    session.commit()
    session.close()

    yield

    Base.metadata.drop_all(bind=test_engine)


def test_ingest_guideline_document():
    session = TestSession()
    raw = "SECTION 1: BRAND IDENTITY.\nNever use 'bank on us'."
    doc = ingest_guideline_document(
        session,
        workspace_id=TEST_WKS_ID,
        title="Acme Guidelines 2026",
        raw_text=raw,
        uploaded_by=TEST_USER_ID,
    )
    session.commit()

    assert doc.id is not None
    assert doc.title == "Acme Guidelines 2026"
    assert doc.content_hash == compute_content_hash(raw)
    assert doc.status == "PARSED"

    # Ingest duplicate content
    doc2 = ingest_guideline_document(
        session,
        workspace_id=TEST_WKS_ID,
        title="Duplicate Guidelines",
        raw_text=raw,
        uploaded_by=TEST_USER_ID,
    )
    assert doc2.id == doc.id
    session.close()


def test_compile_policy_version():
    session = TestSession()
    doc = ingest_guideline_document(
        session,
        workspace_id=TEST_WKS_ID,
        title="Acme Guidelines",
        raw_text="Sample guideline text",
        uploaded_by=TEST_USER_ID,
    )

    rules = [
        {
            "rule_code": "TERM-001",
            "forbidden_term": "bank on us",
            "severity": "CRITICAL",
            "category": "TERMINOLOGY",
            "title": "Prohibition of Banking Verbs",
            "suggested_replacement": "Partner with FDIC bank",
            "source_citation": {"page": 1, "exact_quote": "Never bank on us."},
        }
    ]
    claims = [
        {
            "claim_code": "CLAIM-001",
            "claim_text": "rated #1 banking app with 99.99% uptime",
            "substantiation": "Audit Report 2024",
            "valid_from": "2024-01-01T00:00:00Z",
            "valid_until": "2025-01-01T00:00:00Z",
        }
    ]

    # Compile as ACTIVE with human approver
    policy = compile_policy_version(
        session,
        workspace_id=TEST_WKS_ID,
        source_document_id=doc.id,
        created_by=TEST_USER_ID,
        rules_data=rules,
        claims_data=claims,
        version_number="1.0",
        activate_with_human_approver=TEST_USER_ID,
    )
    session.commit()

    assert policy.id is not None
    assert policy.version_number == "1.0"
    assert policy.status == "ACTIVE"
    assert policy.approved_by == TEST_USER_ID
    assert policy.compiled_rules_count == 1

    # Verify rule and claim attached
    attached_rules = session.query(Rule).filter(Rule.policy_version_id == policy.id).all()
    assert len(attached_rules) == 1
    assert attached_rules[0].rule_code == "TERM-001"

    attached_claims = (
        session.query(ApprovedClaim).filter(ApprovedClaim.policy_version_id == policy.id).all()
    )
    assert len(attached_claims) == 1
    assert attached_claims[0].claim_code == "CLAIM-001"
    session.close()
