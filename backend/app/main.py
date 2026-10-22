"""
app/main.py
───────────
The FastAPI application entry point.

This file:
1. Creates the FastAPI app instance.
2. Configures CORS (Cross-Origin Resource Sharing) so the React frontend
   on localhost:5173 can talk to the API on localhost:8000.
3. Registers routers (API endpoints) — we'll add these in later milestones.
4. Defines a health-check endpoint to confirm the server is running.

What is CORS?
  Browsers block JavaScript from calling an API on a different domain/port
  unless the API explicitly allows it. Since our frontend runs on port 5173
  and our API on port 8000, we must enable CORS.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer
from app.core.config import settings
import os

# ── Create the app instance ────────────────────────────────────────────────
# Adding security_schemes makes Swagger UI show a simple Bearer token field
# instead of the OAuth2 username/password form.
bearer_scheme = HTTPBearer()

app = FastAPI(
    title=settings.APP_NAME,
    description="Multi-vendor online marketplace API",
    version="0.1.0",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

# ── CORS Configuration ─────────────────────────────────────────────────────
# These are the origins (frontend URLs) allowed to call our API.
# In development both localhost and 127.0.0.1 variants are included.
origins = [
    "http://localhost:5173",   # Vite React dev server
    "http://127.0.0.1:5173",
    "http://localhost:3000",   # Alternative React port
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,       # Allow cookies and Authorization headers
    allow_methods=["*"],          # Allow GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],          # Allow all headers including Authorization
)

# ── Static file serving for uploaded images ─────────────────────────────────
# This serves uploaded product images at /uploads/products/filename.jpg
# In production you would use a proper object storage service (S3, R2, etc.)
upload_dir = settings.UPLOAD_DIR
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Health check endpoint ───────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
def health_check():
    """
    Simple endpoint to verify the API is running.
    Your React app or a monitoring service can call this to check uptime.
    """
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
    }


# ── Root endpoint ───────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
def root():
    """
    Root endpoint — confirms the API is reachable.
    """
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs": "/api/docs",
    }

# ── Routers ────────────────────────────────────────────────────────────────
from app.api.v1.endpoints import auth as auth_router
from app.api.v1.endpoints import sellers as sellers_router
from app.api.v1.endpoints import products as products_router
from app.api.v1.endpoints import orders as orders_router

app.include_router(auth_router.router,    prefix="/api/v1/auth",     tags=["Authentication"])
app.include_router(sellers_router.router, prefix="/api/v1/sellers",  tags=["Sellers & Shops"])
app.include_router(products_router.router,prefix="/api/v1/products", tags=["Products & Categories"])
app.include_router(orders_router.router,  prefix="/api/v1/orders",   tags=["Cart & Orders"])
