"""
app/db/base.py
──────────────
Defines the Base class that all SQLAlchemy models inherit from.

When you write:
    class User(Base):
        __tablename__ = "users"
        ...

SQLAlchemy registers that table with this Base. Alembic uses Base.metadata
to discover all tables when generating migration files.

Important: Every model file must be imported somewhere before Alembic runs,
so it knows about all the tables. We do that import in alembic/env.py.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Base class for all database models.
    Inherit from this in every model you create.
    """
    pass
