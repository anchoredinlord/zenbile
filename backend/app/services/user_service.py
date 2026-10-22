"""
app/services/user_service.py
────────────────────────────
Business logic for user operations.

WHY a service layer?
  Endpoints (in app/api/) handle HTTP — reading request data, returning
  responses, and raising HTTP errors.
  Services handle BUSINESS LOGIC — database queries, validation rules,
  and operations that don't belong to a single endpoint.

  This keeps endpoints thin and logic reusable. For example, if we later
  add a Telegram bot that also creates users, it calls the same service
  function instead of duplicating logic.
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import hash_password, verify_password, create_access_token


def get_user_by_email(db: Session, email: str) -> User | None:
    """
    Look up a user by their email address.
    Returns None if no user exists with that email.
    """
    return db.query(User).filter(User.email == email.lower().strip()).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Look up a user by their primary key."""
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, data: UserCreate, role: UserRole = UserRole.customer) -> User:
    """
    Register a new user account.

    Steps:
    1. Check no existing account uses this email.
    2. Hash the password (never store plain text).
    3. Create the User row and commit it to the database.

    Args:
        db:   Database session.
        data: Validated UserCreate schema from the request.
        role: Defaults to customer. Pass UserRole.seller when a seller registers.

    Raises:
        HTTP 409 Conflict if the email is already registered.
    """
    # Normalize email to lowercase so "User@Email.com" and "user@email.com"
    # are treated as the same address.
    email = data.email.lower().strip()

    existing = get_user_by_email(db, email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        email=email,
        password_hash=hash_password(data.password),
        full_name=data.full_name.strip(),
        phone=data.phone,
        role=role,
    )

    db.add(user)
    db.commit()
    db.refresh(user)   # Reload from DB so id, created_at, etc. are populated
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    """
    Verify credentials and return the user if they are correct.

    We use the same error message whether the email or password is wrong.
    This is intentional — telling an attacker "email not found" vs
    "wrong password" reveals which emails are registered.

    Raises:
        HTTP 401 if credentials are invalid or account is inactive.
    """
    invalid_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user = get_user_by_email(db, email)
    if not user:
        raise invalid_credentials

    if not verify_password(password, user.password_hash):
        raise invalid_credentials

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account has been deactivated. Contact support.",
        )

    return user


def login_user(db: Session, email: str, password: str) -> dict:
    """
    Authenticate a user and return a JWT access token.

    Returns a dict with keys: access_token, token_type, user
    """
    user = authenticate_user(db, email, password)
    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


def update_user_profile(db: Session, user: User, data: UserUpdate) -> User:
    """
    Update a user's own profile fields.
    Only updates fields that are actually provided (not None).
    """
    if data.full_name is not None:
        user.full_name = data.full_name.strip()
    if data.phone is not None:
        user.phone = data.phone

    db.commit()
    db.refresh(user)
    return user
