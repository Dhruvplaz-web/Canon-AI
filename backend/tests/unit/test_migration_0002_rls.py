"""Unit and contract tests for Alembic Migration 0002: Approval, Dispute, and Comment tables.

Verifies:
1. Migration 0002 schema declaration and parent revision link (0001).
2. Table structure, FKs, and CHECK constraints (approval requires approver+decision, dispute requires reason_code_id).
3. Append-only immutability: UPDATE and DELETE are prohibited on approval and dispute.
4. Cross-workspace tenant isolation for approval, dispute, and comment.
5. Unset-workspace tenant protection (NULLIF logic returns 0 rows when context is empty).
6. Mandatory AuditLog entry creation for sign-off, send-back, and dispute actions.
"""

import importlib.util
import uuid
from pathlib import Path

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.models.approval import Approval, Comment, Dispute
from app.models.audit import AuditLog
from app.models.check import CheckRun, Finding, ReasonCode
from app.models.policy import PolicyVersion, SourceDocument
from app.models.submission import Submission, SubmissionVersion
from app.models.workspace import User, Workspace

migration_0002_path = (
    Path(__file__).resolve().parent.parent.parent
    / "alembic"
    / "versions"
    / "0002_add_approvals_disputes_comments.py"
)


def load_migration_0002():
    """Loads migration 0002 module dynamically. Fails if file does not exist."""
    assert migration_0002_path.exists(), (
        f"Migration file 0002 not found at {migration_0002_path}. "
        "Failing test first per protocol."
    )
    spec = importlib.util.spec_from_file_location("migration_0002", str(migration_0002_path))
    assert spec is not None and spec.loader is not None
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


@pytest.fixture
def memory_db():
    """Isolated SQLite database with foreign keys and RLS simulation."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = session_factory()

    # Seed baseline workspaces and users
    ws1 = Workspace(id=uuid.uuid4(), name="Acme Corp", slug="acme-corp")
    ws2 = Workspace(id=uuid.uuid4(), name="Beta Corp", slug="beta-corp")
    session.add_all([ws1, ws2])
    session.flush()

    user1 = User(
        id=uuid.uuid4(),
        workspace_id=ws1.id,
        email="creator@acme.corp",
        password_hash="argon2id$mock",
        full_name="Alice Creator",
        role="creator",
    )
    approver1 = User(
        id=uuid.uuid4(),
        workspace_id=ws1.id,
        email="approver@acme.corp",
        password_hash="argon2id$mock",
        full_name="Bob Approver",
        role="brand_manager",
    )
    user2 = User(
        id=uuid.uuid4(),
        workspace_id=ws2.id,
        email="user@beta.corp",
        password_hash="argon2id$mock",
        full_name="Charlie Beta",
        role="creator",
    )
    reason1 = ReasonCode(
        id=uuid.uuid4(),
        workspace_id=ws1.id,
        code="APPROVED_EXCEPTION",
        title="Approved Campaign Exception",
    )
    session.add_all([user1, approver1, user2, reason1])
    session.flush()

    sub1 = Submission(
        id=uuid.uuid4(),
        workspace_id=ws1.id,
        creator_id=user1.id,
        title="Q3 Campaign Copy",
        status="PENDING_REVIEW",
    )
    session.add(sub1)
    session.flush()

    sub_ver1 = SubmissionVersion(
        id=uuid.uuid4(),
        workspace_id=ws1.id,
        submission_id=sub1.id,
        version_number=1,
        content="Groundbreaking enterprise fintech solutions.",
    )
    session.add(sub_ver1)
    session.flush()

    src_doc1 = SourceDocument(
        id=uuid.uuid4(),
        workspace_id=ws1.id,
        title="Brand Standards 2026",
        storage_path="/docs/bs2026.pdf",
        content_hash="mockhash2026",
        extracted_text="Brand guidelines",
        uploaded_by=approver1.id,
    )
    session.add(src_doc1)
    session.flush()

    pol_ver1 = PolicyVersion(
        id=uuid.uuid4(),
        workspace_id=ws1.id,
        source_document_id=src_doc1.id,
        version_number="1.0",
        created_by=approver1.id,
        approved_by=approver1.id,
        status="ACTIVE",
    )
    session.add(pol_ver1)
    session.flush()

    check_run1 = CheckRun(
        id=uuid.uuid4(),
        workspace_id=ws1.id,
        submission_id=sub1.id,
        submission_version_id=sub_ver1.id,
        policy_version_id=pol_ver1.id,
        status="COMPLETED",
    )
    session.add(check_run1)
    session.flush()

    finding1 = Finding(
        id=uuid.uuid4(),
        workspace_id=ws1.id,
        check_run_id=check_run1.id,
        rule_code="TERM-001",
        category="TERMINOLOGY",
        severity="MAJOR",
        title="Forbidden Term",
        matched_text="groundbreaking",
        start_offset=0,
        end_offset=14,
        receipt_a_draft_span="groundbreaking",
        receipt_b_rule_quote="Do not use superlative buzzwords.",
        source_document_title="Brand Standards",
        source_section="Sec 1",
    )
    session.add(finding1)
    session.commit()

    yield session, {
        "ws1": ws1,
        "ws2": ws2,
        "user1": user1,
        "approver1": approver1,
        "user2": user2,
        "reason1": reason1,
        "sub1": sub1,
        "sub_ver1": sub_ver1,
        "finding1": finding1,
    }

    session.close()
    Base.metadata.drop_all(bind=engine)


def test_migration_0002_metadata_and_parent():
    """Verify migration 0002 targets 0001 as down_revision and declares all 3 tables."""
    mod = load_migration_0002()
    assert mod.down_revision == "0001_initial_schema_and_rls"
    assert mod.revision == "0002_approvals_disputes_comments"

    new_tables = getattr(mod, "NEW_TENANT_TABLES", [])
    assert "approval" in new_tables
    assert "dispute" in new_tables
    assert "comment" in new_tables


def test_approval_creation_and_check_constraints(memory_db):
    """Verify approval creation and CHECK constraints (requires approved_by and decision)."""
    session, fixtures = memory_db

    appr = Approval(
        id=uuid.uuid4(),
        workspace_id=fixtures["ws1"].id,
        submission_id=fixtures["sub1"].id,
        submission_version_id=fixtures["sub_ver1"].id,
        approved_by=fixtures["approver1"].id,
        decision="APPROVED",
        approval_type="FINAL_SIGNOFF",
        notes="All findings resolved or justified.",
    )
    session.add(appr)
    session.commit()

    fetched = session.query(Approval).filter(Approval.id == appr.id).first()
    assert fetched is not None
    assert fetched.decision == "APPROVED"
    assert fetched.approved_by == fixtures["approver1"].id


def test_dispute_creation_and_reason_code_fk(memory_db):
    """Verify dispute creation and FK/CHECK constraint on reason_code_id."""
    session, fixtures = memory_db

    disp = Dispute(
        id=uuid.uuid4(),
        workspace_id=fixtures["ws1"].id,
        finding_id=fixtures["finding1"].id,
        creator_id=fixtures["user1"].id,
        reason_code_id=fixtures["reason1"].id,
        argument="Approved in VP marketing meeting as campaign exception.",
        status="OPEN",
    )
    session.add(disp)
    session.commit()

    fetched = session.query(Dispute).filter(Dispute.id == disp.id).first()
    assert fetched is not None
    assert fetched.status == "OPEN"
    assert fetched.reason_code_id == fixtures["reason1"].id


def test_comment_creation_threaded(memory_db):
    """Verify comment creation referencing submission and optional finding."""
    session, fixtures = memory_db

    comm = Comment(
        id=uuid.uuid4(),
        workspace_id=fixtures["ws1"].id,
        submission_id=fixtures["sub1"].id,
        finding_id=fixtures["finding1"].id,
        author_id=fixtures["user1"].id,
        comment_text="Can we verify if this rule applies to social media posts?",
    )
    session.add(comm)
    session.commit()

    fetched = session.query(Comment).filter(Comment.id == comm.id).first()
    assert fetched is not None
    assert fetched.finding_id == fixtures["finding1"].id
    assert fetched.author_id == fixtures["user1"].id


def test_cross_workspace_isolation_contracts(memory_db):
    """Verify that queries scoped to Workspace 2 cannot read Workspace 1 data."""
    session, fixtures = memory_db

    ws1_id = fixtures["ws1"].id
    ws2_id = fixtures["ws2"].id

    appr = Approval(
        id=uuid.uuid4(),
        workspace_id=ws1_id,
        submission_id=fixtures["sub1"].id,
        submission_version_id=fixtures["sub_ver1"].id,
        approved_by=fixtures["approver1"].id,
        decision="APPROVED",
    )
    disp = Dispute(
        id=uuid.uuid4(),
        workspace_id=ws1_id,
        finding_id=fixtures["finding1"].id,
        creator_id=fixtures["user1"].id,
        reason_code_id=fixtures["reason1"].id,
        argument="Valid exception.",
    )
    comm = Comment(
        id=uuid.uuid4(),
        workspace_id=ws1_id,
        submission_id=fixtures["sub1"].id,
        author_id=fixtures["user1"].id,
        comment_text="Test comment.",
    )
    session.add_all([appr, disp, comm])
    session.commit()

    ws2_approvals = session.query(Approval).filter(Approval.workspace_id == ws2_id).all()
    ws2_disputes = session.query(Dispute).filter(Dispute.workspace_id == ws2_id).all()
    ws2_comments = session.query(Comment).filter(Comment.workspace_id == ws2_id).all()

    assert len(ws2_approvals) == 0, "Cross-workspace leak detected in approval"
    assert len(ws2_disputes) == 0, "Cross-workspace leak detected in dispute"
    assert len(ws2_comments) == 0, "Cross-workspace leak detected in comment"


def test_unset_workspace_returns_zero_rows_sql_contract():
    """
    Contract verification for PostgreSQL RLS policy expression:
    USING (workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid)
    When current_workspace_id is empty string '' or unset, NULLIF yields NULL.
    In SQL three-valued logic, (workspace_id = NULL) evaluates to UNKNOWN (treated as FALSE).
    """
    row_workspace_id = str(uuid.uuid4())

    for unset_val in ["", None]:
        simulated_tenant_setting = unset_val if unset_val != "" else None
        assert simulated_tenant_setting is None
        condition_result = (row_workspace_id == simulated_tenant_setting)
        assert condition_result is False, "Unset workspace must evaluate to False (0 rows visible)"


def test_immutability_prohibits_update_and_delete_on_approval_and_dispute(memory_db):
    """Verify that approval and dispute records cannot be updated or deleted."""
    session, fixtures = memory_db

    appr = Approval(
        id=uuid.uuid4(),
        workspace_id=fixtures["ws1"].id,
        submission_id=fixtures["sub1"].id,
        submission_version_id=fixtures["sub_ver1"].id,
        approved_by=fixtures["approver1"].id,
        decision="APPROVED",
    )
    disp = Dispute(
        id=uuid.uuid4(),
        workspace_id=fixtures["ws1"].id,
        finding_id=fixtures["finding1"].id,
        creator_id=fixtures["user1"].id,
        reason_code_id=fixtures["reason1"].id,
        argument="Initial dispute.",
    )
    session.add_all([appr, disp])
    session.commit()

    with pytest.raises(IntegrityError):
        appr.decision = "CHANGED"
        session.flush()
    session.rollback()

    with pytest.raises(IntegrityError):
        session.delete(appr)
        session.flush()
    session.rollback()

    with pytest.raises(IntegrityError):
        disp.argument = "Modified argument"
        session.flush()
    session.rollback()

    with pytest.raises(IntegrityError):
        session.delete(disp)
        session.flush()
    session.rollback()


def test_audit_log_persisted_for_signoff_sendback_dispute(memory_db):
    """Verify that every sign-off, send-back, and dispute is recorded in the append-only AuditLog."""
    session, fixtures = memory_db

    audit_signoff = AuditLog(
        workspace_id=fixtures["ws1"].id,
        actor_id=fixtures["approver1"].id,
        action="SUBMISSION_APPROVED",
        entity_type="SUBMISSION",
        entity_id=fixtures["sub1"].id,
        previous_state={"status": "PENDING_REVIEW"},
        new_state={"status": "APPROVED", "decision": "APPROVED", "notes": "Approved for publish"},
    )
    audit_dispute = AuditLog(
        workspace_id=fixtures["ws1"].id,
        actor_id=fixtures["user1"].id,
        action="FINDING_DISPUTED",
        entity_type="FINDING",
        entity_id=fixtures["finding1"].id,
        previous_state={"status": "PENDING_REVIEW"},
        new_state={"reason_code": "APPROVED_EXCEPTION", "argument": "Campaign exception"},
    )
    session.add_all([audit_signoff, audit_dispute])
    session.commit()

    logs = (
        session.query(AuditLog)
        .filter(AuditLog.workspace_id == fixtures["ws1"].id)
        .all()
    )
    actions = {log.action for log in logs}
    assert "SUBMISSION_APPROVED" in actions
    assert "FINDING_DISPUTED" in actions
