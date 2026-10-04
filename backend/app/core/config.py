"""Application Configuration via Pydantic BaseSettings."""
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "FlowStock"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "flowstock-dev-secret-key-change-in-production-only"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/flowstock_db"
    DATABASE_FALLBACK_SQLITE: str = "sqlite+aiosqlite:///./flowstock.db"

    # Storage
    STORAGE_LOCAL_PATH: str = "./uploads"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_production_secret(cls, v: str, info) -> str:
        # In production, require non-default secret key
        env = info.data.get("ENVIRONMENT", "development") if info.data else "development"
        if env == "production" and v == "flowstock-dev-secret-key-change-in-production-only":
            raise ValueError("SECRET_KEY must be configured with a secure private key in production environment.")
        return v


settings = Settings()
