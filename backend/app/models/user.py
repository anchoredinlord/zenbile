"""
app/models/user.py
──────────────────
SQLAlchemy model for the `users` table.

A "model" is a Python class that maps directly to a database table.
Each class attribute with a Column(...) becomes a column in the table.

USER ROLES explained:
  - customer:  Can browse products, add to cart, place orders.
  - seller:    Can create a shop, upload products, manage their orders.
               Must be approved by an admin before selling publicly.
  - admin:     Full platform access — approve sellers, moderate listings,
               manage categories, oversee all orders.

Why store the role in the users table?
  Simpler for our scale. If we needed hundreds of fine-grained permissions
  we would use a separate roles/permissions table. For now, three roles
  cover everything we need in the MVP.
"""

import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Enum as SAEnum
)
from app.db.base import Base


class UserRole(str, enum.Enum):
    """
    The three roles in our marketplace.
    Inheriting from str means the value can be compared directly to a string,
    which is convenient when checking roles in endpoint logic.
    """
    customer = "customer"
    seller = "seller"
    admin = "admin"


class User(Base):
    """
    Represents one registered user account.

    Table name: users
    """
    __tablename__ = "users"

    # Primary key — auto-incremented unique ID for each user.
    id = Column(Integer, primary_key=True, index=True)

    # Email must be unique — used as the login identifier.
    email = Column(String(255), unique=True, index=True, nullable=False)

    # We store only the bcrypt hash, never the real password.
    password_hash = Column(String(255), nullable=False)

    # Display name shown on the storefront and dashboard.
    full_name = Column(String(150), nullable=False)

    # Optional phone — useful for delivery/order contact.
    phone = Column(String(20), nullable=True)

    # Role determines what the user can access.
    # Default is "customer" — safest starting point.
    role = Column(
        SAEnum(UserRole, name="user_role_enum"),
        nullable=False,
        default=UserRole.customer,
    )

    # Inactive users cannot log in. Admins can deactivate accounts.
    is_active = Column(Boolean, nullable=False, default=True)

    # Profile photo — stored in uploads/profiles/
    # Shows in navbar and profile page instead of the initial letter
    avatar_url = Column(String(500), nullable=True)

    # Timestamps — stored in UTC.
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
