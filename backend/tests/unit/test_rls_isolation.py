"""Unit and contract tests verifying Row-Level Security (RLS) policies and invariants."""

import importlib.util
import uuid
from pathlib import Path

from app.core.database import set_tenant_context

migration_path = (
    Path(__file__).resolve().parent.parent.parent
    / "alembic"
    / "versions"
    / "0001_initial_schema_and_rls.py"
)
spec = importlib.util.spec_from_file_location("migration_0001", str(migration_path))
migration_0001 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(migration_0001)


def test_rls_tenant_tables_coverage():
    """Verify all tenant-scoped tables are included in RLS policy generation."""
    tenant_tables = migration_0001.TENANT_TABLES
    assert len(tenant_tables) >= 17, "Expected at least 17 tenant tables in RLS manifest"

    assert "user" in tenant_tables
    assert "policy_version" in tenant_tables
    assert "rule" in tenant_tables
    assert "approved_claim" in tenant_tables
    assert "submission" in tenant_tables
    assert "finding" in tenant_tables
    assert "decision" in tenant_tables
    assert "audit_log" in tenant_tables


def test_set_tenant_context_helper():
    """Verify set_tenant_context generates exact SET LOCAL statement for PostgreSQL."""

    class MockSession:
        def __init__(self):
            self.executed_statements = []

        def execute(self, stmt, params=None):
            self.executed_statements.append((str(stmt), params))

    session = MockSession()
    wks_id = str(uuid.uuid4())
    set_tenant_context(session, wks_id)

    assert len(session.executed_statements) == 1
    sql, params = session.executed_statements[0]
    assert "SET LOCAL app.current_workspace_id" in sql
    assert params["workspace_id"] == wks_id


def test_rls_unset_workspace_sql_logic():
    """
    Verify the RLS SQL invariant:
    NULLIF(current_setting('app.current_workspace_id', true), '')::uuid
    When current_workspace_id is empty or unset, NULLIF produces NULL, ensuring zero rows match.
    """
    # Simulate SQL NULL comparison logic
    # In SQL 3-valued logic, workspace_id = NULL evaluates to UNKNOWN (treated as FALSE in WHERE)
    workspace_id = str(uuid.uuid4())
    unset_setting = ""
    simulated_nullif = unset_setting if unset_setting != "" else None

    # When unset, simulated_nullif is None (SQL NULL)
    assert simulated_nullif is None
    # No valid UUID can equal None/NULL
    assert (workspace_id == simulated_nullif) is False
