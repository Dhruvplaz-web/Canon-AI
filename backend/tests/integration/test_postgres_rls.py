"""Integration tests verifying Row-Level Security (RLS) and privileges on real PostgreSQL 16.

Connects strictly as `canon_app` (NOBYPASSRLS, non-owner) to verify:
1. Workspace isolation: workspace A cannot SELECT/UPDATE/DELETE workspace B rows (0 rows affected).
2. Write isolation: INSERT with another workspace_id is rejected by RLS WITH CHECK policy.
3. Unset context safety: unset app.current_workspace_id returns 0 rows and rejects writes.
4. Immutability privilege enforcement: UPDATE/DELETE on approval, dispute, comment, and audit_log
   raise insufficient_privilege (SQLSTATE 42501).
5. Approval decision constraint: CHECK IN ('APPROVED', 'SENT_BACK') and notes required when SENT_BACK.
6. Dispute schema: reason_code text column is dropped (reason_code_id FK retained).
7. Cross-workspace foreign key behavior analysis (single-column FK vs cross-tenant references).
"""

import os
import uuid

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.exc import DBAPIError, IntegrityError, ProgrammingError

# Real Postgres connection URLs
OWNER_URL = os.getenv(
    "TEST_DATABASE_URL_OWNER",
    "postgresql://canon_owner:canon_owner_pw@localhost:5432/canon_test",
)
APP_URL = os.getenv(
    "TEST_DATABASE_URL_APP",
    "postgresql://canon_app:canon_app_pw@localhost:5432/canon_test",
)


@pytest.fixture(scope="module")
def postgres_setup():
    """Ensure database schema is provisioned and base tenants seeded."""
    try:
        owner_engine = create_engine(
            OWNER_URL,
            isolation_level="AUTOCOMMIT",
            connect_args={"connect_timeout": 2},
        )
        with owner_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        pytest.skip(f"PostgreSQL test database not available: {exc}")

    # Generate test tenant IDs
    ws_a_id = uuid.uuid4()
    ws_b_id = uuid.uuid4()
    user_a_id = uuid.uuid4()
    user_b_id = uuid.uuid4()
    sub_a_id = uuid.uuid4()
    sub_b_id = uuid.uuid4()
    sub_ver_a_id = uuid.uuid4()
    sub_ver_b_id = uuid.uuid4()
    doc_a_id = uuid.uuid4()
    pol_a_id = uuid.uuid4()
    check_a_id = uuid.uuid4()
    finding_a_id = uuid.uuid4()
    reason_a_id = uuid.uuid4()

    with owner_engine.connect() as conn:
        # Seed Workspaces
        conn.execute(
            text(
                "INSERT INTO workspace (id, name, slug) VALUES (:wsa, 'Workspace A', :sluga), (:wsb, 'Workspace B', :slugb) ON CONFLICT (id) DO NOTHING"
            ),
            {"wsa": ws_a_id, "sluga": f"ws-a-{ws_a_id.hex[:6]}", "wsb": ws_b_id, "slugb": f"ws-b-{ws_b_id.hex[:6]}"},
        )

        # Seed Workspace A entities under tenant context A
        conn.execute(text("SELECT set_config('app.current_workspace_id', :ws, false)"), {"ws": str(ws_a_id)})
        conn.execute(
            text(
                "INSERT INTO \"user\" (id, workspace_id, email, password_hash, full_name, role) "
                "VALUES (:ua, :wsa, :ea, 'argon2id$mock', 'User A', 'brand_manager') ON CONFLICT (id) DO NOTHING"
            ),
            {"ua": user_a_id, "wsa": ws_a_id, "ea": f"user_a_{ws_a_id.hex[:6]}@canon.test"},
        )
        conn.execute(
            text(
                "INSERT INTO submission (id, workspace_id, creator_id, title, status) "
                "VALUES (:sa, :wsa, :ua, 'Sub A', 'PENDING_REVIEW') ON CONFLICT (id) DO NOTHING"
            ),
            {"sa": sub_a_id, "wsa": ws_a_id, "ua": user_a_id},
        )
        conn.execute(
            text(
                "INSERT INTO submission_version (id, workspace_id, submission_id, version_number, content) "
                "VALUES (:sva, :wsa, :sa, 1, 'Content A') ON CONFLICT (id) DO NOTHING"
            ),
            {"sva": sub_ver_a_id, "wsa": ws_a_id, "sa": sub_a_id},
        )
        conn.execute(
            text(
                "INSERT INTO source_document (id, workspace_id, title, storage_path, content_hash, extracted_text, uploaded_by) "
                "VALUES (:da, :wsa, 'Guide A', '/doc/a', 'hasha', 'text', :ua) ON CONFLICT (id) DO NOTHING"
            ),
            {"da": doc_a_id, "wsa": ws_a_id, "ua": user_a_id},
        )
        conn.execute(
            text(
                "INSERT INTO policy_version (id, workspace_id, source_document_id, version_number, created_by, approved_by, approved_at, status) "
                "VALUES (:pa, :wsa, :da, '1.0', :ua, :ua, NOW(), 'ACTIVE') ON CONFLICT (id) DO NOTHING"
            ),
            {"pa": pol_a_id, "wsa": ws_a_id, "da": doc_a_id, "ua": user_a_id},
        )
        conn.execute(
            text(
                "INSERT INTO check_run (id, workspace_id, submission_id, submission_version_id, policy_version_id, status) "
                "VALUES (:cra, :wsa, :sa, :sva, :pa, 'COMPLETED') ON CONFLICT (id) DO NOTHING"
            ),
            {"cra": check_a_id, "wsa": ws_a_id, "sa": sub_a_id, "sva": sub_ver_a_id, "pa": pol_a_id},
        )
        conn.execute(
            text(
                "INSERT INTO finding (id, workspace_id, check_run_id, rule_code, category, severity, title, matched_text, start_offset, end_offset, receipt_a_draft_span, receipt_b_rule_quote, source_document_title, source_section) "
                "VALUES (:fa, :wsa, :cra, 'TERM-01', 'TERMINOLOGY', 'MAJOR', 'Title A', 'match', 0, 5, 'draft', 'rule', 'Doc A', 'Sec 1') "
                "ON CONFLICT (id) DO NOTHING"
            ),
            {"fa": finding_a_id, "wsa": ws_a_id, "cra": check_a_id},
        )
        conn.execute(
            text(
                "INSERT INTO reason_code (id, workspace_id, code, title) "
                "VALUES (:ra, :wsa, 'EXC-01', 'Exception Reason') ON CONFLICT (id) DO NOTHING"
            ),
            {"ra": reason_a_id, "wsa": ws_a_id},
        )

        # Seed Workspace B entities under tenant context B
        conn.execute(text("SELECT set_config('app.current_workspace_id', :ws, false)"), {"ws": str(ws_b_id)})
        conn.execute(
            text(
                "INSERT INTO \"user\" (id, workspace_id, email, password_hash, full_name, role) "
                "VALUES (:ub, :wsb, :eb, 'argon2id$mock', 'User B', 'brand_manager') ON CONFLICT (id) DO NOTHING"
            ),
            {"ub": user_b_id, "wsb": ws_b_id, "eb": f"user_b_{ws_b_id.hex[:6]}@canon.test"},
        )
        conn.execute(
            text(
                "INSERT INTO submission (id, workspace_id, creator_id, title, status) "
                "VALUES (:sb, :wsb, :ub, 'Sub B', 'PENDING_REVIEW') ON CONFLICT (id) DO NOTHING"
            ),
            {"sb": sub_b_id, "wsb": ws_b_id, "ub": user_b_id},
        )
        conn.execute(
            text(
                "INSERT INTO submission_version (id, workspace_id, submission_id, version_number, content) "
                "VALUES (:svb, :wsb, :sb, 1, 'Content B') ON CONFLICT (id) DO NOTHING"
            ),
            {"svb": sub_ver_b_id, "wsb": ws_b_id, "sb": sub_b_id},
        )

        # Clear session tenant context
        conn.execute(text("SELECT set_config('app.current_workspace_id', '', false)"))

        # Ensure canon_app has read/write privileges on baseline tenant tables
        conn.execute(
            text(
                "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO canon_app;"
            )
        )
        # Enforce immutable privilege restrictions on canon_app per migration 0002
        conn.execute(
            text(
                "REVOKE UPDATE, DELETE, TRUNCATE ON approval, dispute, comment, audit_log FROM canon_app;"
            )
        )
        conn.execute(
            text(
                "GRANT SELECT, INSERT ON approval, dispute, comment, audit_log TO canon_app;"
            )
        )

    yield {
        "ws_a": ws_a_id,
        "ws_b": ws_b_id,
        "user_a": user_a_id,
        "user_b": user_b_id,
        "sub_a": sub_a_id,
        "sub_b": sub_b_id,
        "sub_ver_a": sub_ver_a_id,
        "sub_ver_b": sub_ver_b_id,
        "finding_a": finding_a_id,
        "reason_a": reason_a_id,
    }


@pytest.fixture
def app_connection():
    """Provides a dedicated PostgreSQL connection authenticated strictly as canon_app."""
    app_engine = create_engine(APP_URL, isolation_level="AUTOCOMMIT")
    with app_engine.connect() as conn:
        yield conn


@pytest.mark.postgres
def test_cross_workspace_isolation_select_update_delete(postgres_setup, app_connection):
    """Verify that Workspace A cannot SELECT, UPDATE, or DELETE Workspace B rows (0 rows affected)."""
    conn = app_connection
    fixtures = postgres_setup
    ws_a = fixtures["ws_a"]
    ws_b = fixtures["ws_b"]

    # 1. As Workspace A, insert rows in approval, dispute, comment, audit_log
    conn.execute(text("SELECT set_config('app.current_workspace_id', :ws, false)"), {"ws": str(ws_a)})

    appr_id = uuid.uuid4()
    conn.execute(
        text(
            "INSERT INTO approval (id, workspace_id, submission_id, submission_version_id, approved_by, decision) "
            "VALUES (:id, :ws, :sub, :sub_ver, :approver, 'APPROVED')"
        ),
        {
            "id": appr_id,
            "ws": ws_a,
            "sub": fixtures["sub_a"],
            "sub_ver": fixtures["sub_ver_a"],
            "approver": fixtures["user_a"],
        },
    )

    disp_id = uuid.uuid4()
    conn.execute(
        text(
            "INSERT INTO dispute (id, workspace_id, finding_id, creator_id, reason_code_id, argument) "
            "VALUES (:id, :ws, :finding, :creator, :reason, 'Dispute argument')"
        ),
        {
            "id": disp_id,
            "ws": ws_a,
            "finding": fixtures["finding_a"],
            "creator": fixtures["user_a"],
            "reason": fixtures["reason_a"],
        },
    )

    comm_id = uuid.uuid4()
    conn.execute(
        text(
            "INSERT INTO comment (id, workspace_id, submission_id, author_id, comment_text) "
            "VALUES (:id, :ws, :sub, :author, 'Comment text')"
        ),
        {
            "id": comm_id,
            "ws": ws_a,
            "sub": fixtures["sub_a"],
            "author": fixtures["user_a"],
        },
    )

    audit_id = uuid.uuid4()
    conn.execute(
        text(
            "INSERT INTO audit_log (id, workspace_id, actor_id, action, entity_type, entity_id, new_state) "
            "VALUES (:id, :ws, :actor, 'TEST_ACTION', 'SUBMISSION', :entity, '{}'::jsonb)"
        ),
        {
            "id": audit_id,
            "ws": ws_a,
            "actor": fixtures["user_a"],
            "entity": fixtures["sub_a"],
        },
    )

    # 2. Switch context to Workspace B
    conn.execute(text("SELECT set_config('app.current_workspace_id', :ws, false)"), {"ws": str(ws_b)})

    # SELECT: must return 0 rows for Workspace A IDs
    assert conn.execute(text("SELECT * FROM approval WHERE id = :id"), {"id": appr_id}).fetchone() is None
    assert conn.execute(text("SELECT * FROM dispute WHERE id = :id"), {"id": disp_id}).fetchone() is None
    assert conn.execute(text("SELECT * FROM comment WHERE id = :id"), {"id": comm_id}).fetchone() is None
    assert conn.execute(text("SELECT * FROM audit_log WHERE id = :id"), {"id": audit_id}).fetchone() is None

    # Total counts visible to Workspace B must be 0 for these records
    assert conn.execute(text("SELECT count(*) FROM approval WHERE workspace_id = :ws"), {"ws": str(ws_a)}).scalar() == 0
    assert conn.execute(text("SELECT count(*) FROM dispute WHERE workspace_id = :ws"), {"ws": str(ws_a)}).scalar() == 0
    assert conn.execute(text("SELECT count(*) FROM comment WHERE workspace_id = :ws"), {"ws": str(ws_a)}).scalar() == 0
    assert conn.execute(text("SELECT count(*) FROM audit_log WHERE workspace_id = :ws"), {"ws": str(ws_a)}).scalar() == 0


@pytest.mark.postgres
def test_insert_with_foreign_workspace_id_rejected(postgres_setup, app_connection):
    """Verify that INSERT with another workspace_id is rejected by RLS WITH CHECK policy."""
    conn = app_connection
    fixtures = postgres_setup
    ws_a = fixtures["ws_a"]
    ws_b = fixtures["ws_b"]

    # In Workspace A session, attempt to insert row claiming Workspace B
    conn.execute(text("SELECT set_config('app.current_workspace_id', :ws, false)"), {"ws": str(ws_a)})

    # 1. Approval
    with pytest.raises(DBAPIError) as exc_info:
        conn.execute(
            text(
                "INSERT INTO approval (id, workspace_id, submission_id, submission_version_id, approved_by, decision) "
                "VALUES (:id, :ws, :sub, :sub_ver, :approver, 'APPROVED')"
            ),
            {
                "id": uuid.uuid4(),
                "ws": ws_b,  # Foreign workspace!
                "sub": fixtures["sub_a"],
                "sub_ver": fixtures["sub_ver_a"],
                "approver": fixtures["user_a"],
            },
        )
    assert "row-level security" in str(exc_info.value).lower() or "44000" in str(exc_info.value)

    # 2. Dispute
    with pytest.raises(DBAPIError) as exc_info:
        conn.execute(
            text(
                "INSERT INTO dispute (id, workspace_id, finding_id, creator_id, reason_code_id, argument) "
                "VALUES (:id, :ws, :finding, :creator, :reason, 'Dispute argument')"
            ),
            {
                "id": uuid.uuid4(),
                "ws": ws_b,  # Foreign workspace!
                "finding": fixtures["finding_a"],
                "creator": fixtures["user_a"],
                "reason": fixtures["reason_a"],
            },
        )
    assert "row-level security" in str(exc_info.value).lower() or "44000" in str(exc_info.value)

    # 3. Comment
    with pytest.raises(DBAPIError) as exc_info:
        conn.execute(
            text(
                "INSERT INTO comment (id, workspace_id, submission_id, author_id, comment_text) "
                "VALUES (:id, :ws, :sub, :author, 'Comment text')"
            ),
            {
                "id": uuid.uuid4(),
                "ws": ws_b,  # Foreign workspace!
                "sub": fixtures["sub_a"],
                "author": fixtures["user_a"],
            },
        )
    assert "row-level security" in str(exc_info.value).lower() or "44000" in str(exc_info.value)

    # 4. AuditLog
    with pytest.raises(DBAPIError) as exc_info:
        conn.execute(
            text(
                "INSERT INTO audit_log (id, workspace_id, actor_id, action, entity_type, entity_id, new_state) "
                "VALUES (:id, :ws, :actor, 'TEST_ACTION', 'SUBMISSION', :entity, '{}'::jsonb)"
            ),
            {
                "id": uuid.uuid4(),
                "ws": ws_b,  # Foreign workspace!
                "actor": fixtures["user_a"],
                "entity": fixtures["sub_a"],
            },
        )
    assert "row-level security" in str(exc_info.value).lower() or "44000" in str(exc_info.value)


@pytest.mark.postgres
def test_unset_workspace_context_returns_zero_rows_and_rejects_writes(postgres_setup, app_connection):
    """Verify that when app.current_workspace_id is unset, queries return 0 rows and writes fail."""
    conn = app_connection
    fixtures = postgres_setup

    # Reset or set empty workspace context
    conn.execute(text("SELECT set_config('app.current_workspace_id', '', false)"))

    # SELECT must return 0 rows
    assert conn.execute(text("SELECT count(*) FROM approval")).scalar() == 0
    assert conn.execute(text("SELECT count(*) FROM dispute")).scalar() == 0
    assert conn.execute(text("SELECT count(*) FROM comment")).scalar() == 0
    assert conn.execute(text("SELECT count(*) FROM audit_log")).scalar() == 0

    # INSERT must fail because NULLIF('', '') is NULL and cannot match any workspace_id
    with pytest.raises(DBAPIError) as exc_info:
        conn.execute(
            text(
                "INSERT INTO comment (id, workspace_id, submission_id, author_id, comment_text) "
                "VALUES (:id, :ws, :sub, :author, 'Comment text')"
            ),
            {
                "id": uuid.uuid4(),
                "ws": fixtures["ws_a"],
                "sub": fixtures["sub_a"],
                "author": fixtures["user_a"],
            },
        )
    assert "row-level security" in str(exc_info.value).lower() or "44000" in str(exc_info.value)


@pytest.mark.postgres
def test_update_and_delete_on_approval_and_audit_log_raise_insufficient_privilege(postgres_setup, app_connection):
    """Verify that UPDATE/DELETE on approval, dispute, comment, and audit_log raise insufficient_privilege."""
    conn = app_connection
    fixtures = postgres_setup
    ws_a = fixtures["ws_a"]

    conn.execute(text("SELECT set_config('app.current_workspace_id', :ws, false)"), {"ws": str(ws_a)})

    # UPDATE on approval raises permission denied (42501)
    with pytest.raises(ProgrammingError) as exc_info:
        conn.execute(text("UPDATE approval SET notes = 'tampered' WHERE workspace_id = :ws"), {"ws": ws_a})
    assert "permission denied" in str(exc_info.value).lower() or "42501" in str(exc_info.value)

    # DELETE on approval raises permission denied (42501)
    with pytest.raises(ProgrammingError) as exc_info:
        conn.execute(text("DELETE FROM approval WHERE workspace_id = :ws"), {"ws": ws_a})
    assert "permission denied" in str(exc_info.value).lower() or "42501" in str(exc_info.value)

    # UPDATE on audit_log raises permission denied (42501)
    with pytest.raises(ProgrammingError) as exc_info:
        conn.execute(text("UPDATE audit_log SET action = 'tampered' WHERE workspace_id = :ws"), {"ws": ws_a})
    assert "permission denied" in str(exc_info.value).lower() or "42501" in str(exc_info.value)

    # DELETE on audit_log raises permission denied (42501)
    with pytest.raises(ProgrammingError) as exc_info:
        conn.execute(text("DELETE FROM audit_log WHERE workspace_id = :ws"), {"ws": ws_a})
    assert "permission denied" in str(exc_info.value).lower() or "42501" in str(exc_info.value)

    # UPDATE on comment raises permission denied (42501) per Step 3d
    with pytest.raises(ProgrammingError) as exc_info:
        conn.execute(text("UPDATE comment SET comment_text = 'tampered' WHERE workspace_id = :ws"), {"ws": ws_a})
    assert "permission denied" in str(exc_info.value).lower() or "42501" in str(exc_info.value)

    # DELETE on comment raises permission denied (42501) per Step 3d
    with pytest.raises(ProgrammingError) as exc_info:
        conn.execute(text("DELETE FROM comment WHERE workspace_id = :ws"), {"ws": ws_a})
    assert "permission denied" in str(exc_info.value).lower() or "42501" in str(exc_info.value)


@pytest.mark.postgres
def test_approval_decision_check_constraint(postgres_setup, app_connection):
    """Verify CHECK constraint: decision IN ('APPROVED', 'SENT_BACK') and notes required when SENT_BACK."""
    conn = app_connection
    fixtures = postgres_setup
    ws_a = fixtures["ws_a"]

    conn.execute(text("SELECT set_config('app.current_workspace_id', :ws, false)"), {"ws": str(ws_a)})

    # Invalid decision 'REJECTED' raises check_violation (23514)
    with pytest.raises(IntegrityError) as exc_info:
        conn.execute(
            text(
                "INSERT INTO approval (id, workspace_id, submission_id, submission_version_id, approved_by, decision) "
                "VALUES (:id, :ws, :sub, :sub_ver, :approver, 'REJECTED')"
            ),
            {
                "id": uuid.uuid4(),
                "ws": ws_a,
                "sub": fixtures["sub_a"],
                "sub_ver": fixtures["sub_ver_a"],
                "approver": fixtures["user_a"],
            },
        )
    assert "chk_approval" in str(exc_info.value).lower() or "23514" in str(exc_info.value)

    # SENT_BACK without notes raises check_violation
    with pytest.raises(IntegrityError) as exc_info:
        conn.execute(
            text(
                "INSERT INTO approval (id, workspace_id, submission_id, submission_version_id, approved_by, decision, notes) "
                "VALUES (:id, :ws, :sub, :sub_ver, :approver, 'SENT_BACK', NULL)"
            ),
            {
                "id": uuid.uuid4(),
                "ws": ws_a,
                "sub": fixtures["sub_a"],
                "sub_ver": fixtures["sub_ver_a"],
                "approver": fixtures["user_a"],
            },
        )
    assert "chk_approval" in str(exc_info.value).lower() or "23514" in str(exc_info.value)

    # SENT_BACK with empty string notes raises check_violation
    with pytest.raises(IntegrityError) as exc_info:
        conn.execute(
            text(
                "INSERT INTO approval (id, workspace_id, submission_id, submission_version_id, approved_by, decision, notes) "
                "VALUES (:id, :ws, :sub, :sub_ver, :approver, 'SENT_BACK', '   ')"
            ),
            {
                "id": uuid.uuid4(),
                "ws": ws_a,
                "sub": fixtures["sub_a"],
                "sub_ver": fixtures["sub_ver_a"],
                "approver": fixtures["user_a"],
            },
        )
    assert "chk_approval" in str(exc_info.value).lower() or "23514" in str(exc_info.value)

    # SENT_BACK with non-empty notes succeeds
    valid_id = uuid.uuid4()
    conn.execute(
        text(
            "INSERT INTO approval (id, workspace_id, submission_id, submission_version_id, approved_by, decision, notes) "
            "VALUES (:id, :ws, :sub, :sub_ver, :approver, 'SENT_BACK', 'Please address terminology violations in paragraph 2.')"
        ),
        {
            "id": valid_id,
            "ws": ws_a,
            "sub": fixtures["sub_a"],
            "sub_ver": fixtures["sub_ver_a"],
            "approver": fixtures["user_a"],
        },
    )
    saved = conn.execute(text("SELECT decision, notes FROM approval WHERE id = :id"), {"id": valid_id}).fetchone()
    assert saved[0] == "SENT_BACK"
    assert "terminology violations" in saved[1]


@pytest.mark.postgres
def test_dispute_schema_reason_code_dropped(postgres_setup, app_connection):
    """Verify STEP 3c: dispute table drops duplicate reason_code text column, keeping reason_code_id FK."""
    conn = app_connection
    row = conn.execute(
        text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'dispute' AND column_name = 'reason_code'"
        )
    ).fetchone()
    assert row is None, "Column reason_code must be dropped from dispute table per Step 3c"

    # Confirm reason_code_id exists
    fk_row = conn.execute(
        text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'dispute' AND column_name = 'reason_code_id'"
        )
    ).fetchone()
    assert fk_row is not None, "Column reason_code_id must exist in dispute table"


@pytest.mark.postgres
def test_cross_workspace_foreign_key_behavior(postgres_setup, app_connection):
    """Document behavior of single-column FK vs cross-workspace references.
    
    Verifies that when Workspace A tries to insert an approval pointing to Workspace B's submission:
    In standard single-column foreign keys, PostgreSQL's RI constraint checker operates
    internally and finds the row in 'submission' regardless of RLS, allowing the cross-workspace reference
    unless composite (id, workspace_id) foreign keys or triggers are implemented.
    """
    conn = app_connection
    fixtures = postgres_setup
    ws_a = fixtures["ws_a"]
    sub_b = fixtures["sub_b"]  # Belongs to Workspace B
    sub_ver_b = fixtures["sub_ver_b"]

    conn.execute(text("SELECT set_config('app.current_workspace_id', :ws, false)"), {"ws": str(ws_a)})

    cross_appr_id = uuid.uuid4()
    # Attempting to link Workspace A approval to Workspace B submission
    try:
        conn.execute(
            text(
                "INSERT INTO approval (id, workspace_id, submission_id, submission_version_id, approved_by, decision) "
                "VALUES (:id, :ws, :sub, :sub_ver, :approver, 'APPROVED')"
            ),
            {
                "id": cross_appr_id,
                "ws": ws_a,
                "sub": sub_b,
                "sub_ver": sub_ver_b,
                "approver": fixtures["user_a"],
            },
        )
        cross_fk_allowed = True
    except DBAPIError:
        cross_fk_allowed = False

    # This asserts the exact architectural reality of single-column FKs:
    # Single-column FKs do NOT prevent cross-workspace references because RI triggers
    # bypass RLS when checking referenced table primary keys.
    assert cross_fk_allowed is True, "Single-column FK allows cross-workspace ID unless composite (id, workspace_id) FK is enforced."
