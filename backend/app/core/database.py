"""Database engine, session management, and RLS session hooks."""

from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.core.config import settings

# Engine with connection timeout & health checking
connect_args = {"connect_timeout": 3} if "postgresql" in settings.DATABASE_URL else {}

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args=connect_args,
    future=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True,
)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency that yields a database session and ensures cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def set_tenant_context(session: Session, workspace_id: str) -> None:
    """
    Sets the PostgreSQL session local variable for Row-Level Security (RLS).
    Enforces tenant data isolation via app.current_workspace_id.
    """
    session.execute(
        text("SET LOCAL app.current_workspace_id = :workspace_id"),
        {"workspace_id": str(workspace_id)},
    )
