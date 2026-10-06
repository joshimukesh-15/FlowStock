"""SQLAlchemy Async Database Configuration (PostgreSQL)."""
from typing import AsyncGenerator, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import text
from app.core.config import settings

# Dedicated PostgreSQL async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_active_engine():
    """Return the active PostgreSQL database engine."""
    return engine


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for obtaining database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def check_db_health() -> Dict[str, Any]:
    """Check PostgreSQL database connectivity and health status."""
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            val = result.scalar()
            return {
                "status": "healthy" if val == 1 else "degraded",
                "connected": True,
                "engine": "postgresql",
                "url": settings.DATABASE_URL,
            }
    except Exception as exc:
        return {
            "status": "unhealthy",
            "connected": False,
            "engine": "postgresql",
            "error": str(exc),
        }

