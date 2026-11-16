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
    username: Optional[str] = None   # Optional at registration

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

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip().lower()
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        if len(v) > 30:
            raise ValueError("Username cannot exceed 30 characters")
        # Only letters, numbers, underscores, hyphens
        import re
        if not re.match(r'^[a-z0-9_\-]+$', v):
            raise ValueError("Username can only contain letters, numbers, _ and -")
        return v


# ── Login — accepts email OR username ────────────────────────────────────────

class UserLogin(BaseModel):
    """
    Login with either email or username.
    If the value contains @ it is treated as an email.
    Otherwise it is treated as a username.
    """
    login: str    # email OR username
    password: str


# ── Response schemas ──────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str]
    role: UserRole
    is_active: bool
    avatar_url: Optional[str] = None
    username: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Profile update ────────────────────────────────────────────────────────────

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone:     Optional[str] = None
    email:     Optional[EmailStr] = None
    username:  Optional[str] = None   # Allow setting/changing username

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        import re
        v = v.strip().lower()
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        if len(v) > 30:
            raise ValueError("Username cannot exceed 30 characters")
        if not re.match(r'^[a-z0-9_\-]+$', v):
            raise ValueError("Username can only contain letters, numbers, _ and -")
        return v


# ── JWT token response ────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenData(BaseModel):
    user_id: Optional[int] = None
