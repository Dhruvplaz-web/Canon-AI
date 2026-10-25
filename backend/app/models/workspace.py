"""Workspace and User ORM models."""

import uuid

from sqlalchemy import Boolean, Column, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import GUID, TimestampMixin


class Workspace(Base, TimestampMixin):
    """Multi-tenant boundary for policies, users, submissions, and audit trails."""

    __tablename__ = "workspace"

    id = Column(GUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    settings = Column(JSONB, nullable=False, default=dict)

    # Relationships
    users = relationship("User", back_populates="workspace", cascade="all, delete-orphan")


class User(Base, TimestampMixin):
    """Workspace member with role-based access control (RBAC)."""

    __tablename__ = "user"

    id = Column(GUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        GUID(as_uuid=True),
        ForeignKey("workspace.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    email = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(
        String(50),
        nullable=False,
        default="creator",
    )  # Enum: creator, reviewer, approver, brand_manager, agency, it_admin, exec
    is_active = Column(Boolean, nullable=False, default=True)

    __table_args__ = (UniqueConstraint("workspace_id", "email", name="uq_user_workspace_email"),)

    # Relationships
    workspace = relationship("Workspace", back_populates="users")
