"""
app/schemas/shop.py
───────────────────
Pydantic schemas for seller registration and shop management.
"""

from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime
from typing import Optional
from app.models.shop import SellerStatus


# ── Seller Registration ───────────────────────────────────────────────────────

class SellerRegisterRequest(BaseModel):
    """
    Data a new seller submits when registering.
    They provide both their user account info and their shop info at once.
    """
    # User account fields
    email: str
    password: str
    full_name: str
    phone: Optional[str] = None

    # Shop fields
    shop_name: str
    shop_description: Optional[str] = None
    shop_phone: Optional[str] = None
    shop_location: Optional[str] = None

    @field_validator("shop_name")
    @classmethod
    def shop_name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Shop name cannot be empty")
        if len(v) < 2:
            raise ValueError("Shop name must be at least 2 characters")
        return v

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


# ── Shop responses ────────────────────────────────────────────────────────────

class ShopOut(BaseModel):
    """Shop data returned in API responses."""
    id: int
    name: str
    slug: str
    description: Optional[str]
    phone: Optional[str]
    location: Optional[str]
    logo_url: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShopUpdate(BaseModel):
    """Fields a seller can update on their own shop."""
    name: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None


# ── Seller Profile responses ──────────────────────────────────────────────────

class SellerProfileOut(BaseModel):
    """Seller profile data — includes approval status."""
    id: int
    user_id: int
    status: SellerStatus
    admin_note: Optional[str]
    reviewed_at: Optional[datetime]
    created_at: datetime
    shop: Optional[ShopOut]

    model_config = ConfigDict(from_attributes=True)


# ── Admin approval ────────────────────────────────────────────────────────────

class SellerReviewRequest(BaseModel):
    """
    Data the admin sends when approving or rejecting a seller.
    """
    status: SellerStatus
    admin_note: Optional[str] = None

    @field_validator("status")
    @classmethod
    def must_be_decision(cls, v: SellerStatus) -> SellerStatus:
        # Admin can only approve, reject, or suspend — not set back to pending
        if v == SellerStatus.pending:
            raise ValueError("Status cannot be set back to pending")
        return v


# ── Combined registration response ───────────────────────────────────────────

class SellerRegisterResponse(BaseModel):
    """Returned after a successful seller registration."""
    message: str
    seller_id: int
    shop_slug: str
    status: SellerStatus
