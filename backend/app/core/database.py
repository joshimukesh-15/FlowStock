"""SQLAlchemy Async Database Configuration with Dual PostgreSQL & Local Fallback."""
from typing import AsyncGenerator, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import text
from app.core.config import settings

# Primary PostgreSQL engine
pg_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
)

# Resilient local fallback engine
sqlite_engine = create_async_engine(
    settings.DATABASE_FALLBACK_SQLITE,
    echo=False,
    future=True,
)

active_engine = None
active_dialect = None

AsyncSessionLocal = async_sessionmaker(
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_active_engine():
    """Determine and return active working database engine."""
    global active_engine, active_dialect
    if active_engine is not None:
        return active_engine

    # Try connecting to PostgreSQL first
    try:
        async with pg_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            active_engine = pg_engine
            active_dialect = "postgresql"
            AsyncSessionLocal.configure(bind=active_engine)
            return active_engine
    except Exception:
        # PostgreSQL not currently running locally, activate SQLite fallback
        active_engine = sqlite_engine
        active_dialect = "sqlite"
        AsyncSessionLocal.configure(bind=active_engine)
        return active_engine


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for obtaining database sessions."""
    await get_active_engine()
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def check_db_health() -> Dict[str, Any]:
    """Check database connectivity, dialect, and health status."""
    engine = await get_active_engine()
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            val = result.scalar()
            return {
                "status": "healthy" if val == 1 else "degraded",
                "connected": True,
                "engine": active_dialect,
                "url": settings.DATABASE_URL if active_dialect == "postgresql" else settings.DATABASE_FALLBACK_SQLITE,
            }
    except Exception as exc:
        return {
            "status": "unhealthy",
            "connected": False,
            "engine": active_dialect,
            "error": str(exc),
        }
