"""0001: Initial Milestone 1 17-Table Schema and Row-Level Security (RLS).

Revision ID: 0001_initial_schema_and_rls
Revises:
Create Date: 2026-10-26 01:15:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema_and_rls"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TENANT_TABLES = [
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
]


def upgrade() -> None:
    # 1. Workspace (Tenant Root)
    op.create_table(
        "workspace",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column(
            "settings", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )
    op.create_index("idx_workspace_slug", "workspace", ["slug"])

    # 2. User
    op.create_table(
        "user",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workspace.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("role", sa.String(50), nullable=False, server_default="creator"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.UniqueConstraint("workspace_id", "email", name="uq_user_workspace_email"),
    )
    op.create_index("idx_user_workspace_email", "user", ["workspace_id", "email"])

    # 3. Source Document
    op.create_table(
        "source_document",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workspace.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("document_type", sa.String(50), nullable=False, server_default="GUIDELINE"),
        sa.Column("storage_path", sa.String(512), nullable=False),
        sa.Column("content_hash", sa.String(64), nullable=False),
        sa.Column("page_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("extracted_text", sa.Text(), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="PARSED"),
        sa.Column(
            "uploaded_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.UniqueConstraint("workspace_id", "content_hash", name="uq_source_doc_hash"),
    )

    # 4. Policy Version
    op.create_table(
        "policy_version",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workspace.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "source_document_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("source_document.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("version_number", sa.String(20), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="DRAFT"),
        sa.Column("compiled_rules_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("change_summary", sa.Text(), nullable=True),
        sa.Column(
            "created_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "approved_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="RESTRICT"),
            nullable=True,
        ),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "effective_date",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.UniqueConstraint("workspace_id", "version_number", name="uq_policy_version"),
        sa.CheckConstraint(
            "(status != 'ACTIVE') OR (approved_by IS NOT NULL)",
            name="chk_active_policy_must_be_human_approved",
        ),
    )

    # 5. Rule
    op.create_table(
        "rule",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workspace.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "policy_version_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("policy_version.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("rule_code", sa.String(50), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("severity", sa.String(50), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("pattern_or_term", sa.String(255), nullable=True),
        sa.Column("suggested_replacement", sa.String(512), nullable=True),
        sa.Column(
            "source_citation",
            postgresql.JSONB,
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.UniqueConstraint("policy_version_id", "rule_code", name="uq_policy_rule_code"),
    )
    op.create_index("idx_rule_code", "rule", ["rule_code"])

    # 6. Approved Claim (Review Condition 1: with valid_until)
    op.create_table(
        "approved_claim",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workspace.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "policy_version_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("policy_version.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("claim_code", sa.String(50), nullable=False),
        sa.Column("claim_text", sa.Text(), nullable=False),
        sa.Column("substantiation", sa.Text(), nullable=False),
        sa.Column("valid_from", sa.DateTime(timezone=True), nullable=False),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.UniqueConstraint("policy_version_id", "claim_code", name="uq_policy_claim_code"),
    )
    op.create_index("idx_claim_code", "approved_claim", ["claim_code"])

    # 7. Submission
    op.create_table(
        "submission",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workspace.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "creator_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("channel", sa.String(50), nullable=False, server_default="web_landing_page"),
        sa.Column("current_version_number", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("status", sa.String(50), nullable=False, server_default="DRAFT"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # 8. Submission Version
    op.create_table(
        "submission_version",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workspace.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "submission_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("submission.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("version_number", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("word_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("character_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "offset_map", postgresql.JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.UniqueConstraint("submission_id", "version_number", name="uq_submission_version"),
    )

    # 9. Check Run
    op.create_table(
        "check_run",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workspace.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "submission_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("submission.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "submission_version_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("submission_version.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "policy_version_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("policy_version.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("status", sa.String(50), nullable=False, server_default="RUNNING"),
        sa.Column("total_findings", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_overrides", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # 10. Finding (Double-Receipt)
    op.create_table(
        "finding",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workspace.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "check_run_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("check_run.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "rule_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("rule.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("rule_code", sa.String(50), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("severity", sa.String(50), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("matched_text", sa.Text(), nullable=False),
        sa.Column("start_offset", sa.Integer(), nullable=False),
        sa.Column("end_offset", sa.Integer(), nullable=False),
        sa.Column("suggested_fix", sa.Text(), nullable=True),
        sa.Column("receipt_a_draft_span", sa.Text(), nullable=False),
        sa.Column("receipt_b_rule_quote", sa.Text(), nullable=False),
        sa.Column("source_document_title", sa.String(255), nullable=False),
        sa.Column("source_section", sa.String(255), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="PENDING_REVIEW"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )
    op.create_index("idx_finding_rule_code", "finding", ["rule_code"])

    # 11. Decision (Override)
    op.create_table(
        "decision",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workspace.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "finding_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("finding.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "reviewer_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("decision_type", sa.String(50), nullable=False),
        sa.Column("reason_code", sa.String(50), nullable=False),
        sa.Column("justification", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # 12. Reason Code
    op.create_table(
        "reason_code",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workspace.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("code", sa.String(50), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.UniqueConstraint("workspace_id", "code", name="uq_reason_code_workspace"),
    )

    # 13. Rule Health Snapshot
    op.create_table(
        "rule_health_snapshot",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workspace.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("rule_code", sa.String(50), nullable=False),
        sa.Column(
            "snapshot_date",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column("total_evaluations", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_flags", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_overrides", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("override_rate", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("diagnostic_status", sa.String(50), nullable=False, server_default="HEALTHY"),
        sa.Column("primary_override_reason", sa.String(50), nullable=False, server_default="NONE"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # 14. Rule Change Proposal (Review Condition 7: Seeded deterministic draft proposal PROP-01)
    op.create_table(
        "rule_change_proposal",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workspace.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("proposal_code", sa.String(50), nullable=False),
        sa.Column(
            "policy_version_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("policy_version.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("target_rule_code", sa.String(50), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("rationale", sa.Text(), nullable=False),
        sa.Column(
            "proposed_diff", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")
        ),
        sa.Column("status", sa.String(50), nullable=False, server_default="DRAFT"),
        sa.Column(
            "created_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("adopted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # 15. Backtest Run
    op.create_table(
        "backtest_run",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workspace.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "proposal_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("rule_change_proposal.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", sa.String(50), nullable=False, server_default="RUNNING"),
        sa.Column(
            "historical_submissions_analyzed", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column("prior_pass_rate", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("simulated_pass_rate", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("false_positives_eliminated", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("regressions_detected", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("safety_score", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column(
            "recommendation",
            sa.String(50),
            nullable=False,
            server_default="SAFE_FOR_HUMAN_APPROVAL",
        ),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # 16. Backtest Result
    op.create_table(
        "backtest_result",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workspace.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "backtest_run_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("backtest_run.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "submission_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("submission.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("original_status", sa.String(50), nullable=False),
        sa.Column("simulated_status", sa.String(50), nullable=False),
        sa.Column(
            "finding_diff", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")
        ),
        sa.Column("is_regression", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # 17. Job
    op.create_table(
        "job",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workspace.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("job_type", sa.String(50), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="QUEUED"),
        sa.Column("progress_percent", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "heartbeat_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # 18. Audit Log (Append-Only)
    op.create_table(
        "audit_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workspace.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "actor_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("previous_state", postgresql.JSONB, nullable=True),
        sa.Column(
            "new_state", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")
        ),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )
    op.create_index("idx_audit_log_created", "audit_log", ["created_at"])

    # 19. AI Service Call (Disclosure Telemetry)
    op.create_table(
        "ai_service_call",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workspace.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "check_run_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("check_run.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("provider_name", sa.String(100), nullable=False),
        sa.Column("model_name", sa.String(100), nullable=False),
        sa.Column("prompt_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completion_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("latency_ms", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("payload_summary", sa.String(255), nullable=False),
        sa.Column("redacted_flag", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column(
            "retention_note",
            sa.String(255),
            nullable=False,
            server_default="Zero data retained for training per provider agreement",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # Enable and Force Row-Level Security on all tenant-scoped tables
    for tbl in TENANT_TABLES:
        op.execute(f'ALTER TABLE "{tbl}" ENABLE ROW LEVEL SECURITY;')
        op.execute(f'ALTER TABLE "{tbl}" FORCE ROW LEVEL SECURITY;')
        op.execute(
            f'CREATE POLICY "{tbl}_workspace_isolation" ON "{tbl}" '
            f"FOR ALL USING (workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid) "
            f"WITH CHECK (workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid);"
        )


def downgrade() -> None:
    for tbl in reversed(TENANT_TABLES):
        op.execute(f'DROP POLICY IF EXISTS "{tbl}_workspace_isolation" ON "{tbl}";')
        op.drop_table(tbl)
    op.drop_table("workspace")
