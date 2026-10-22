"""
app/db/session.py
─────────────────
Creates the SQLAlchemy database engine and session factory.

Key concepts:
- Engine:  The connection pool to PostgreSQL. Created once at startup.
- Session: A "conversation" with the database. One session per request.
- get_db(): A FastAPI dependency that gives each request its own session
            and always closes it when the request is done (via finally).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from app.core.config import settings

# Create the engine — this opens the connection pool to PostgreSQL.
# pool_pre_ping=True checks if a connection is still alive before using it,
# which prevents errors after the database restarts.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=settings.DEBUG,
    # SQLite needs this extra argument; PostgreSQL ignores it safely
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {},
)

# SessionLocal is a factory — calling SessionLocal() gives you a new session.
# autocommit=False means we control when data is saved (more reliable).
# autoflush=False means SQLAlchemy won't automatically send changes to the DB.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency for database sessions.

    Usage in any endpoint:
        from fastapi import Depends
        from app.db.session import get_db

        @router.get("/example")
        def example(db: Session = Depends(get_db)):
            ...

    The 'yield' makes this a generator — FastAPI automatically:
    1. Creates a session before the request handler runs.
    2. Passes it to the handler via db parameter.
    3. Closes the session after the handler finishes (even if it crashes).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
