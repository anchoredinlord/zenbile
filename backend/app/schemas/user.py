"""
app/schemas/user.py
───────────────────
Pydantic schemas for user-related API requests and responses.
"""

from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from datetime import datetime
from typing import Optional
from app.models.user import UserRole


# ── Registration ──────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_must_be_strong(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v

    @field_validator("full_name")
    @classmethod
    def full_name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Full name cannot be empty")
        return v


# ── Login ─────────────────────────────────────────────────────────────────────

class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ── Response schemas ──────────────────────────────────────────────────────────

class UserOut(BaseModel):
    """
    User data returned in API responses.
    password_hash is never included here.
    """
    id: int
    email: str
    full_name: str
    phone: Optional[str]
    role: UserRole
    is_active: bool
    avatar_url: Optional[str] = None   # Profile photo URL
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Profile update ────────────────────────────────────────────────────────────

class UserUpdate(BaseModel):
    """
    Fields a user can update on their own profile.
    All fields are optional — only provided fields are updated.
    """
    full_name: Optional[str] = None
    phone:     Optional[str] = None
    email:     Optional[EmailStr] = None   # Allow email change

    @field_validator("email")
    @classmethod
    def email_not_empty(cls, v):
        if v and not v.strip():
            raise ValueError("Email cannot be empty")
        return v


# ── JWT token response ────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenData(BaseModel):
    user_id: Optional[int] = None
