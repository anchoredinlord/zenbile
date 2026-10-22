"""
app/schemas/user.py
───────────────────
Pydantic schemas for user-related API requests and responses.

IMPORTANT DISTINCTION:
  - Models  (app/models/)   → SQLAlchemy classes → map to database tables
  - Schemas (app/schemas/)  → Pydantic classes   → validate HTTP request/response data

Why separate them?
  The database model has sensitive fields like `password_hash` that we
  should NEVER send in an API response. Schemas let us define exactly
  what data comes IN (request) and goes OUT (response), independently
  of what is stored in the database.

Schema naming convention used here:
  UserCreate   → data the client sends when registering
  UserLogin    → data the client sends when logging in
  UserOut      → data we send back (no password hash!)
  UserUpdate   → data a user can change about their own profile
  Token        → the JWT response after a successful login
"""

from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from datetime import datetime
from app.models.user import UserRole


# ── Registration ─────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    """Data required to create a new user account."""
    email: EmailStr               # Pydantic validates email format automatically
    password: str
    full_name: str
    phone: str | None = None      # Optional

    @field_validator("password")
    @classmethod
    def password_must_be_strong(cls, v: str) -> str:
        """
        Basic password rules. Improve these for production.
        """
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
    """Data required to log in."""
    email: EmailStr
    password: str


# ── Response schemas (safe to send to the client) ────────────────────────────

class UserOut(BaseModel):
    """
    User data returned in API responses.
    Notice: no password_hash field here — never expose that.
    """
    id: int
    email: str
    full_name: str
    phone: str | None
    role: UserRole
    is_active: bool
    created_at: datetime

    # model_config tells Pydantic to read data from SQLAlchemy model attributes.
    # Without this, Pydantic only reads from dicts, not ORM objects.
    model_config = ConfigDict(from_attributes=True)


# ── Profile update ────────────────────────────────────────────────────────────

class UserUpdate(BaseModel):
    """Fields a user can update on their own profile."""
    full_name: str | None = None
    phone: str | None = None


# ── JWT token response ────────────────────────────────────────────────────────

class Token(BaseModel):
    """Returned after a successful login."""
    access_token: str
    token_type: str = "bearer"    # Standard OAuth2 value
    user: UserOut                 # Include user info so the frontend doesn't
                                  # need to make a second request after login


class TokenData(BaseModel):
    """
    The decoded contents we extract from a JWT token.
    user_id is the value stored in the token's "sub" (subject) claim.
    """
    user_id: int | None = None
