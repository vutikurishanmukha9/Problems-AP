from typing import List, Optional
from urllib.parse import urlparse, urlunparse
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Problems@AP API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database URL (defaults to SQLite, automatically normalized for Neon/PostgreSQL)
    DATABASE_URL: str = "sqlite+aiosqlite:///./problems_ap.db"
    
    # Whether the original Neon URL requested SSL (detected automatically)
    DATABASE_USE_SSL: bool = False
    
    # Cloudinary image storage settings (Optional in local dev, active when keys provided)
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None
    
    # Secret internal platform key for trusted client-server communication
    PLATFORM_SECRET_KEY: str = "ap-problems-civic-v1-secure-token"
    
    # Allowed CORS Origins for frontend integration (Vercel, localhost, etc.)
    CORS_ORIGINS: List[str] = [
        "https://ap-problems.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
    ]
    
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str]) -> str:
        if not v:
            return "sqlite+aiosqlite:///./problems_ap.db"
        # Only transform postgres:// URLs
        if not (v.startswith("postgres://") or v.startswith("postgresql://")):
            return v
        
        # Swap scheme to asyncpg driver
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://") and "+asyncpg" not in v:
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        
        # Strip ALL query parameters (sslmode, channel_binding, etc.)
        # asyncpg does not understand libpq query params; SSL is handled
        # separately via connect_args in database.py
        parsed = urlparse(v)
        clean = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            "",  # params
            "",  # query  (stripped)
            "",  # fragment
        ))
        return clean

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()

# Auto-detect SSL requirement from original DATABASE_URL env var
import os as _os
_raw_db_url = _os.environ.get("DATABASE_URL", "")
if "sslmode=require" in _raw_db_url or "ssl=require" in _raw_db_url:
    settings.DATABASE_USE_SSL = True
elif _raw_db_url.startswith("postgres://") or _raw_db_url.startswith("postgresql://"):
    # Neon always needs SSL even if not explicitly stated
    settings.DATABASE_USE_SSL = True
