"""
app/core/security.py
────────────────────
Password hashing and JWT token utilities.

Two things happen here:

1. PASSWORD HASHING
   We never store a user's real password. Instead we store a hash — a
   one-way transformation. When a user logs in we hash what they typed
   and compare it to the stored hash. If they match, the password is correct.
   We use bcrypt, which is the industry standard for password hashing.

2. JWT TOKENS (JSON Web Tokens)
   After a successful login we give the user a token — a signed string.
   The user sends this token with every future request in the header:
       Authorization: Bearer <token>
   FastAPI reads the token, verifies the signature, and knows who the user is
   without checking the database on every single request.
"""

from datetime import datetime, timedelta, timezone
from typing import Any
from jose import jwt, JWTError
import bcrypt
from app.core.config import settings


def hash_password(plain_password: str) -> str:
    """
    Turn a plain-text password into a bcrypt hash.
    bcrypt.hashpw requires bytes, so we encode the string first.
    The result is decoded back to a string for storage in the database.
    """
    password_bytes = plain_password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Check if a plain-text password matches the stored hash.
    Returns True if they match, False otherwise.
    """
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def create_access_token(subject: Any, expires_delta: timedelta | None = None) -> str:
    """
    Create a signed JWT access token.

    Args:
        subject: Usually the user's ID (stored as the "sub" claim).
        expires_delta: How long until the token expires.
    """
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    expire = datetime.now(timezone.utc) + expires_delta

    payload = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """
    Decode and verify a JWT token.
    Returns the payload dict if valid, None if invalid or expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except JWTError:
        return None
