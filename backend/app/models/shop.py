"""
app/models/shop.py
──────────────────
Database models for seller profiles and shops.

Two tables are created here:

1. seller_profiles — extra information about a user who is a seller.
   Every seller has one profile. It stores their approval status.

2. shops — the actual storefront a seller owns.
   A seller can have one shop. Customers browse shops and see products.

WHY two tables instead of one?
  A seller_profile tracks the business relationship (approved? suspended?).
  A shop tracks the public storefront (name, description, logo).
  Keeping them separate makes it easy to add multiple shops per seller
  in the future without redesigning everything.

APPROVAL FLOW:
  Seller registers → status = "pending"
  Admin reviews   → status = "approved" or "rejected"
  Only "approved" sellers can publish products publicly.
"""

import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    Enum as SAEnum, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from app.db.base import Base


class SellerStatus(str, enum.Enum):
    """
    The lifecycle of a seller application.
    pending   → just registered, waiting for admin review
    approved  → can sell publicly
    rejected  → application denied
    suspended → was approved but later suspended by admin
    """
    pending   = "pending"
    approved  = "approved"
    rejected  = "rejected"
    suspended = "suspended"


class SellerProfile(Base):
    """
    Extra information about a user who has registered as a seller.
    Always linked to exactly one User.

    Table: seller_profiles
    """
    __tablename__ = "seller_profiles"

    id = Column(Integer, primary_key=True, index=True)

    # Each seller profile belongs to exactly one user.
    # ondelete="CASCADE" means if the user is deleted, the profile is too.
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,       # One seller profile per user
        nullable=False,
        index=True,
    )

    # Admin approval status
    status = Column(
        SAEnum(SellerStatus, name="seller_status_enum"),
        nullable=False,
        default=SellerStatus.pending,
    )

    # Optional note from the admin explaining why they approved/rejected
    admin_note = Column(Text, nullable=True)

    # Who reviewed this application (admin user id)
    reviewed_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # When the admin reviewed it
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
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

    # Relationships — lets us write seller_profile.user to get the User object
    user     = relationship("User", foreign_keys=[user_id], backref="seller_profile")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    shop     = relationship("Shop", back_populates="seller", uselist=False)

    def __repr__(self):
        return f"<SellerProfile user_id={self.user_id} status={self.status}>"


class Shop(Base):
    """
    The public storefront owned by a seller.
    Customers browse shops and see their products.

    Table: shops
    """
    __tablename__ = "shops"

    id = Column(Integer, primary_key=True, index=True)

    # Linked to the seller's profile, not directly to the user.
    seller_id = Column(
        Integer,
        ForeignKey("seller_profiles.id", ondelete="CASCADE"),
        unique=True,       # One shop per seller (for now)
        nullable=False,
        index=True,
    )

    # Shop display name — shown to customers
    name = Column(String(150), nullable=False)

    # URL-friendly identifier, e.g. "abebes-shoes"
    # Customers can visit /shops/abebes-shoes
    slug = Column(String(150), unique=True, nullable=False, index=True)

    # Shown on the shop page
    description = Column(Text, nullable=True)

    # Phone number customers can use to contact the seller
    phone = Column(String(20), nullable=True)

    # Physical location or area (e.g. "Bole, Addis Ababa")
    location = Column(String(255), nullable=True)

    # Logo image filename (stored in uploads/)
    logo_url = Column(String(500), nullable=True)

    # Whether the shop is visible to customers
    # Set to False automatically when seller is suspended
    is_active = Column(Boolean, nullable=False, default=True)

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

    # Relationships
    seller = relationship("SellerProfile", back_populates="shop")

    def __repr__(self):
        return f"<Shop id={self.id} name={self.name} slug={self.slug}>"
