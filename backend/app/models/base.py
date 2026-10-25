"""Base model, custom types, and common mixins for Canon ORM models."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import CHAR, TypeDecorator

from app.core.database import Base

__all__ = ["GUID", "Base", "TenantMixin", "TimestampMixin", "utcnow"]


class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's native UUID type, otherwise uses CHAR(36).
    Transparently handles both uuid.UUID objects and string representations.
    """

    impl = CHAR
    cache_ok = True

    def __init__(self, as_uuid: bool = True, *args, **kwargs):
        self.as_uuid = as_uuid
        super().__init__(*args, **kwargs)

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=self.as_uuid))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return uuid.UUID(str(value)) if not isinstance(value, uuid.UUID) else value


def utcnow() -> datetime:
    """Returns current UTC timestamp with timezone."""
    return datetime.now(UTC)


class TimestampMixin:
    """Provides created_at and updated_at UTC timestamps."""

    created_at = Column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )


class TenantMixin:
    """Provides workspace tenant boundary foreign key."""

    workspace_id = Column(
        GUID(as_uuid=True),
        ForeignKey("workspace.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
