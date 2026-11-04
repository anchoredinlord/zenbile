"""
app/api/v1/endpoints/auth.py
────────────────────────────
Authentication endpoints: register and login.

API routes defined here:
  POST /api/v1/auth/register  → create a customer account
  POST /api/v1/auth/login     → log in and receive a JWT token
  GET  /api/v1/auth/me        → return the currently logged-in user's profile

Why POST for login instead of a form?
  We could use OAuth2's standard form-based login (which uses form fields
  instead of JSON). We use JSON here because it's simpler for our React
  frontend to work with. The /api/docs "Authorize" button still works
  because we set tokenUrl in oauth2_scheme.
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.user import UserCreate, UserLogin, UserOut, Token, UserUpdate
from app.services.user_service import create_user, login_user, update_user_profile, upload_user_avatar
from app.core.deps import get_current_active_user
from app.models.user import User

router = APIRouter()


@router.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new customer account",
)
def register(data: UserCreate, db: Session = Depends(get_db)):
    """Create a new customer account."""
    return create_user(db=db, data=data)


@router.post(
    "/login",
    response_model=Token,
    summary="Log in and receive a JWT access token",
)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email and password. Returns JWT token."""
    return login_user(db=db, email=data.email, password=data.password)


@router.get(
    "/me",
    response_model=UserOut,
    summary="Get the currently logged-in user's profile",
)
def get_me(current_user: User = Depends(get_current_active_user)):
    """Returns the profile of whoever is currently logged in."""
    return current_user


@router.put(
    "/me",
    response_model=UserOut,
    summary="Update profile — name, phone, or email",
)
def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update the logged-in user's profile.
    You can change your name, phone, and email address.
    If you change your email, make sure to log in with the new email next time.
    """
    return update_user_profile(db=db, user=current_user, data=data)


@router.post(
    "/me/avatar",
    response_model=UserOut,
    summary="Upload a profile photo",
)
async def upload_avatar(
    file: UploadFile = File(..., description="Profile photo (jpg, png, webp — max 3MB)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Upload a profile photo.
    Replaces the existing photo if one was already uploaded.
    Allowed types: jpg, jpeg, png, webp. Maximum size: 3MB.
    """
    return await upload_user_avatar(db=db, user=current_user, file=file)
