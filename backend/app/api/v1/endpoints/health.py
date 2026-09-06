"""Health Check and Diagnostic Endpoints."""
from fastapi import APIRouter, status
from app.core.config import settings
from app.core.database import check_db_health
from app.services.cache import cache_service

router = APIRouter()


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """Verify backend health, database connection, and cache status."""
    db_health = await check_db_health()
    # Ping in-memory cache
    await cache_service.set("ping", "pong", ttl_seconds=10)
    cache_val = await cache_service.get("ping")
    cache_healthy = cache_val == "pong"

    is_overall_healthy = db_health.get("connected", False) and cache_healthy

    return {
        "status": "healthy" if is_overall_healthy else "degraded",
        "app": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "version": "0.1.0",
        "database": db_health,
        "cache": {
            "status": "healthy" if cache_healthy else "unhealthy",
            "provider": "in_memory",
        },
    }
