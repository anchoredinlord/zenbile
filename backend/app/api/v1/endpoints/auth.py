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

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.user import UserCreate, UserLogin, UserOut, Token, UserUpdate
from app.services.user_service import create_user, login_user, update_user_profile
from app.core.deps import get_current_active_user
from app.models.user import User

# APIRouter groups related endpoints.
# The prefix and tags are set when we include this router in main.py.
router = APIRouter()


@router.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new customer account",
)
def register(data: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new customer account.

    - Email must be unique.
    - Password must be at least 8 characters.
    - Returns the new user object (without password hash).

    To register as a seller, use POST /api/v1/sellers/register instead
    (which we build in Milestone 2).
    """
    user = create_user(db=db, data=data)
    return user


@router.post(
    "/login",
    response_model=Token,
    summary="Log in and receive a JWT access token",
)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate with email and password.

    Returns:
        access_token: JWT string — send this in the Authorization header
                      of all future authenticated requests.
        token_type:   Always "bearer".
        user:         The logged-in user's profile.

    Example header for authenticated requests:
        Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    """
    result = login_user(db=db, email=data.email, password=data.password)
    return result


@router.get(
    "/me",
    response_model=UserOut,
    summary="Get the currently logged-in user's profile",
)
def get_me(current_user: User = Depends(get_current_active_user)):
    """
    Returns the profile of whoever is currently logged in.
    Requires a valid JWT token in the Authorization header.

    The React frontend can call this on startup to check if a saved
    token is still valid and to load the user's name and role.
    """
    return current_user


@router.put(
    "/me",
    response_model=UserOut,
    summary="Update the current user's profile",
)
def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update the logged-in user's own profile.
    Only the fields provided are updated; the rest stay unchanged.
    """
    updated_user = update_user_profile(db=db, user=current_user, data=data)
    return updated_user
