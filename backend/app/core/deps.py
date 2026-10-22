"""
app/core/deps.py
────────────────
FastAPI dependencies for authentication and authorization.

A "dependency" in FastAPI is a function that runs before your endpoint handler.
You declare it with Depends() in your route parameters.

Example usage in any endpoint:
    from app.core.deps import get_current_user, require_seller, require_admin

    @router.get("/my-products")
    def list_my_products(current_user: User = Depends(require_seller)):
        # Only sellers can reach this code.
        # current_user is already loaded from the database.
        ...

HOW AUTHENTICATION WORKS (step by step):
  1. User logs in → receives a JWT token.
  2. User sends the token in every request header:
         Authorization: Bearer eyJhbGci...
  3. FastAPI calls get_current_user() before the endpoint runs.
  4. get_current_user() decodes the token, finds the user in the database,
     and returns the User object.
  5. If the token is missing, expired, or invalid → 401 Unauthorized.
  6. If the user is inactive → 401 Unauthorized.
  7. Role-specific dependencies (require_seller, require_admin) then check
     the user's role and raise 403 Forbidden if it does not match.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User, UserRole

# HTTPBearer tells Swagger UI to show a simple "Bearer token" input box
# instead of the OAuth2 username/password form.
bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Decode the JWT token from the Authorization header and return the user.
    Raises HTTP 401 if the token is invalid or the user does not exist.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id_str: str | None = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account has been deactivated",
        )

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Alias for get_current_user that makes intent clearer in endpoint signatures.
    Use this when any authenticated user (any role) can access the endpoint.
    """
    return current_user


def require_seller(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Require the user to be a seller or admin.
    Raises HTTP 403 if the user is a customer.
    """
    if current_user.role not in (UserRole.seller, UserRole.admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seller account required",
        )
    return current_user


def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Require the user to be an admin.
    Raises HTTP 403 for customers and sellers.
    """
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required",
        )
    return current_user
