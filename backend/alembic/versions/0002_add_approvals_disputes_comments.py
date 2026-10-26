"""0002: Add Approval, Dispute, and Comment tables with Row-Level Security (RLS).

Revision ID: 0002_approvals_disputes_comments
Revises: 0001_initial_schema_and_rls
Create Date: 2026-10-26 07:35:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic (<= 32 characters for alembic_version.version_num)
revision: str = "0002_approvals_disputes_comments"
down_revision: str | None = "0001_initial_schema_and_rls"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

NEW_TENANT_TABLES = [
    "approval",
    "dispute",
    "comment",
]


def upgrade() -> None:
    # 1. Approval (Formal Sign-off Certificate - ENT-17)
    op.create_table(
        "approval",
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
            "approved_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("decision", sa.String(50), nullable=False),
        sa.Column(
            "approval_type", sa.String(50), nullable=False, server_default="FINAL_SIGNOFF"
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "signed_off_at",
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
        sa.CheckConstraint(
            "decision IN ('APPROVED', 'SENT_BACK') AND (decision != 'SENT_BACK' OR (notes IS NOT NULL AND length(trim(notes)) > 0))",
            name="chk_approval_decision_and_notes",
        ),
    )
    op.create_index("idx_approval_workspace", "approval", ["workspace_id"])
    op.create_index("idx_approval_submission", "approval", ["submission_id"])
    op.create_index("idx_approval_approver", "approval", ["approved_by"])

    # 2. Dispute (Creator Contest of Finding - ENT-14)
    op.create_table(
        "dispute",
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
            "creator_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "reason_code_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("reason_code.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("argument", sa.Text(), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="OPEN"),
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
    op.create_index("idx_dispute_workspace", "dispute", ["workspace_id"])
    op.create_index("idx_dispute_finding", "dispute", ["finding_id"])
    op.create_index("idx_dispute_creator", "dispute", ["creator_id"])

    # 3. Comment (Threaded Collaboration - ENT-16)
    op.create_table(
        "comment",
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
            "finding_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("finding.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "author_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("comment_text", sa.Text(), nullable=False),
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
    op.create_index("idx_comment_workspace", "comment", ["workspace_id"])
    op.create_index("idx_comment_submission", "comment", ["submission_id"])
    op.create_index("idx_comment_finding", "comment", ["finding_id"])

    # 4. Enable and Force Row-Level Security on all new tenant-scoped tables
    for tbl in NEW_TENANT_TABLES:
        op.execute(f'ALTER TABLE "{tbl}" ENABLE ROW LEVEL SECURITY;')
        op.execute(f'ALTER TABLE "{tbl}" FORCE ROW LEVEL SECURITY;')
        op.execute(
            f'CREATE POLICY "{tbl}_workspace_isolation" ON "{tbl}" '
            f"FOR ALL USING (workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid) "
            f"WITH CHECK (workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid);"
        )

    # 5. Non-Owner Role Privilege Restrictions
    # Raises an explicit exception if canon_app is missing;
    # Grants SELECT & INSERT only on approval, dispute, comment, audit_log; revokes UPDATE, DELETE, TRUNCATE.
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'canon_app') THEN
                RAISE EXCEPTION 'Mandatory application role "canon_app" does not exist. Aborting migration.';
            END IF;

            REVOKE UPDATE, DELETE, TRUNCATE ON approval, dispute, comment, audit_log FROM canon_app;
            GRANT SELECT, INSERT ON approval, dispute, comment, audit_log TO canon_app;
        END $$;
        """
    )


def downgrade() -> None:
    # Drop RLS policies and tables in reverse order
    for tbl in reversed(NEW_TENANT_TABLES):
        op.execute(f'DROP POLICY IF EXISTS "{tbl}_workspace_isolation" ON "{tbl}";')
        op.drop_table(tbl)
