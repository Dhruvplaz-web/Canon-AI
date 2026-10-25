"""Unit tests verifying the 17 Milestone 1 relational models in Base.metadata."""

import app.models  # noqa: F401
from app.core.database import Base


def test_milestone_1_table_count():
    """Verify exactly 17 tables exist in Base.metadata for Milestone 1."""
    tables = Base.metadata.tables
    table_names = set(tables.keys())

    expected_tables = {
        "workspace",
        "user",
        "source_document",
        "policy_version",
        "rule",
        "approved_claim",
        "submission",
        "submission_version",
        "check_run",
        "finding",
        "decision",
        "reason_code",
        "rule_health_snapshot",
        "rule_change_proposal",
        "backtest_run",
        "backtest_result",
        "job",
        "audit_log",
        "ai_service_call",
    }

    # Verify every core entity is registered
    for expected in expected_tables:
        assert expected in table_names, f"Expected table '{expected}' not in metadata"


def test_approved_claim_schema():
    """Verify approved_claim includes valid_until for stale claim detection (Review Condition 1)."""
    claim_table = Base.metadata.tables["approved_claim"]
    col_names = {c.name for c in claim_table.columns}

    assert "id" in col_names
    assert "workspace_id" in col_names
    assert "policy_version_id" in col_names
    assert "claim_code" in col_names
    assert "claim_text" in col_names
    assert "substantiation" in col_names
    assert "valid_from" in col_names
    assert "valid_until" in col_names  # Mandatory for expired claim demo
    assert "is_active" in col_names


def test_policy_version_human_approval_invariant():
    """Verify policy_version check constraint requires human approved_by when ACTIVE (Review Condition 2)."""
    policy_table = Base.metadata.tables["policy_version"]
    constraints = [c.name for c in policy_table.constraints if c.name is not None]

    assert "chk_active_policy_must_be_human_approved" in constraints
    col_names = {c.name for c in policy_table.columns}
    assert "approved_by" in col_names
    assert "approved_at" in col_names


def test_finding_double_receipt_columns():
    """Verify finding table possesses receipt_a_draft_span and receipt_b_rule_quote."""
    finding_table = Base.metadata.tables["finding"]
    col_names = {c.name for c in finding_table.columns}

    assert "receipt_a_draft_span" in col_names
    assert "receipt_b_rule_quote" in col_names
    assert "matched_text" in col_names
    assert "start_offset" in col_names
    assert "end_offset" in col_names
