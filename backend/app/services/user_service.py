"""
app/services/user_service.py
────────────────────────────
Business logic for user operations.
"""

import os
import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings

# Allowed image types for avatars
ALLOWED_AVATAR_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
AVATAR_UPLOAD_DIR = "uploads/profiles"


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email.lower().strip()).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, data: UserCreate, role: UserRole = UserRole.customer) -> User:
    """Register a new user account."""
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
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    """Verify credentials and return the user."""
    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        raise invalid

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account has been deactivated. Contact support.",
        )
    return user


def login_user(db: Session, email: str, password: str) -> dict:
    """Authenticate and return a JWT token."""
    user = authenticate_user(db, email, password)
    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer", "user": user}


def update_user_profile(db: Session, user: User, data: UserUpdate) -> User:
    """
    Update a user's own profile.
    Supports changing name, phone, and email.
    Email change checks that the new email is not taken by another account.
    """
    if data.full_name is not None:
        user.full_name = data.full_name.strip()

    if data.phone is not None:
        user.phone = data.phone

    # Handle email change
    if data.email is not None:
        new_email = data.email.lower().strip()
        if new_email != user.email:
            # Check new email is not already used by someone else
            existing = get_user_by_email(db, new_email)
            if existing and existing.id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This email address is already used by another account",
                )
            user.email = new_email

    db.commit()
    db.refresh(user)
    return user


async def upload_user_avatar(db: Session, user: User, file: UploadFile) -> User:
    """
    Upload a profile photo for a user.

    - Validates file type (jpg, png, webp only)
    - Validates file size (max 3MB)
    - Saves with a unique UUID filename
    - Deletes the old avatar if one existed
    - Updates user.avatar_url in the database
    """
    # Validate extension
    original_name = file.filename or "avatar"
    ext = os.path.splitext(original_name)[1].lower()
    if ext not in ALLOWED_AVATAR_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Use: jpg, png, or webp",
        )

    # Read and validate size (max 3MB)
    content = await file.read()
    max_size = 3 * 1024 * 1024  # 3MB
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image too large. Maximum size is 3MB",
        )

    # Delete old avatar file from disk if it exists
    if user.avatar_url:
        old_filename = user.avatar_url.split("/")[-1]
        old_path = os.path.join(AVATAR_UPLOAD_DIR, old_filename)
        if os.path.exists(old_path):
            os.remove(old_path)

    # Save new file with UUID name
    os.makedirs(AVATAR_UPLOAD_DIR, exist_ok=True)
    filename = f"avatar_{user.id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(AVATAR_UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    # Update database
    user.avatar_url = f"/uploads/profiles/{filename}"
    db.commit()
    db.refresh(user)
    return user
