"""
app/core/config.py
──────────────────
Reads all environment variables from the .env file using Pydantic Settings.
Import `settings` anywhere in the app to access configuration values.

Why Pydantic Settings?
- It validates that required variables exist at startup.
- It gives you type-checked access (settings.SECRET_KEY is always a str).
- It never hard-codes passwords or secrets into source code.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Zenbil"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # File uploads
    UPLOAD_DIR: str = "uploads/products"
    MAX_UPLOAD_SIZE_MB: int = 5

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache()
def get_settings() -> Settings:
    """
    Return a cached Settings instance.
    lru_cache means this function only reads the .env file once,
    not on every request. More efficient.
    """
    return Settings()


# A convenient module-level shortcut so you can write:
#   from app.core.config import settings
settings = get_settings()
