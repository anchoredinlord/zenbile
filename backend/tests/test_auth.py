"""
tests/test_auth.py
──────────────────
Automated tests for the authentication endpoints.

Run with:
    cd ~/myweb/zenbil/backend
    source venv/bin/activate
    pytest tests/test_auth.py -v

What these tests verify:
  - A new user can register successfully.
  - Registering with a duplicate email is rejected.
  - Registering with a short password is rejected.
  - A registered user can log in with correct credentials.
  - Login with wrong password is rejected.
  - The /me endpoint returns the correct user when a valid token is sent.
  - The /me endpoint rejects requests without a token.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base import Base
from app.db.session import get_db

# ── In-memory SQLite database for tests ─────────────────────────────────────
# We use SQLite instead of PostgreSQL for tests so they run fast and don't
# require a running database server. Each test run starts with a fresh db.
SQLITE_TEST_URL = "sqlite:///./test_zenbil.db"

test_engine = create_engine(
    SQLITE_TEST_URL,
    connect_args={"check_same_thread": False},
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    """Replace the real database session with the test one."""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Tell FastAPI to use our test database instead of the real one.
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    """Create all tables before each test, drop them after."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    """Return a TestClient that makes requests to the app."""
    return TestClient(app)


# ── Registration tests ───────────────────────────────────────────────────────

def test_register_success(client):
    """A new user can register with valid data."""
    response = client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "securepass123",
        "full_name": "Test User",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    assert data["role"] == "customer"
    # IMPORTANT: password_hash must never appear in the response
    assert "password_hash" not in data
    assert "password" not in data


def test_register_duplicate_email(client):
    """Registering with an already-used email is rejected."""
    payload = {
        "email": "duplicate@example.com",
        "password": "securepass123",
        "full_name": "First User",
    }
    client.post("/api/v1/auth/register", json=payload)     # First registration
    response = client.post("/api/v1/auth/register", json=payload)  # Duplicate
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_register_weak_password(client):
    """Passwords shorter than 8 characters are rejected."""
    response = client.post("/api/v1/auth/register", json={
        "email": "weak@example.com",
        "password": "short",
        "full_name": "Weak Password User",
    })
    assert response.status_code == 422   # Pydantic validation error


def test_register_invalid_email(client):
    """Invalid email format is rejected."""
    response = client.post("/api/v1/auth/register", json={
        "email": "not-an-email",
        "password": "securepass123",
        "full_name": "Invalid Email User",
    })
    assert response.status_code == 422


# ── Login tests ──────────────────────────────────────────────────────────────

def test_login_success(client):
    """Registered user can log in and receive a token."""
    # Register first
    client.post("/api/v1/auth/register", json={
        "email": "logintest@example.com",
        "password": "securepass123",
        "full_name": "Login Test",
    })
    # Now log in
    response = client.post("/api/v1/auth/login", json={
        "email": "logintest@example.com",
        "password": "securepass123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "logintest@example.com"


def test_login_wrong_password(client):
    """Wrong password is rejected with 401."""
    client.post("/api/v1/auth/register", json={
        "email": "wrongpass@example.com",
        "password": "correctpass123",
        "full_name": "Wrong Pass Test",
    })
    response = client.post("/api/v1/auth/login", json={
        "email": "wrongpass@example.com",
        "password": "wrongpassword",
    })
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    """Login with unknown email returns 401 (not 404 — intentional)."""
    response = client.post("/api/v1/auth/login", json={
        "email": "nobody@example.com",
        "password": "somepassword",
    })
    assert response.status_code == 401


# ── /me endpoint tests ───────────────────────────────────────────────────────

def test_get_me_authenticated(client):
    """Authenticated user can retrieve their own profile."""
    # Register and login
    client.post("/api/v1/auth/register", json={
        "email": "me@example.com",
        "password": "securepass123",
        "full_name": "Me Test User",
    })
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "me@example.com",
        "password": "securepass123",
    })
    token = login_resp.json()["access_token"]

    # Call /me with the token
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@example.com"
    assert data["full_name"] == "Me Test User"


def test_get_me_unauthenticated(client):
    """Calling /me without a token returns 401."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
