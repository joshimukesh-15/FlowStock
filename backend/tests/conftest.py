"""Pytest Configuration and Fixtures with Isolated Test Database."""
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

import app.core.database as db_module
from app.main import app
from app.models.base import Base
from app.core.seed import seed_demo_data

TEST_DB_FILE = "test_flowstock.db"
TEST_DATABASE_URL = f"sqlite+aiosqlite:///./{TEST_DB_FILE}"

# Dedicated isolated engine for automated tests
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, future=True)

# Bind the core database module to the test engine
db_module.active_engine = test_engine
db_module.active_dialect = "sqlite"
db_module.AsyncSessionLocal.configure(bind=test_engine)



@pytest_asyncio.fixture(autouse=True)
async def setup_test_database():
    """Ensure test database schema is created and demo data seeded before tests."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_demo_data()
    yield


@pytest_asyncio.fixture(scope="session", autouse=True)
def cleanup_test_db():
    """Clean up test database file when pytest session completes."""
    yield
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(test_engine.dispose())
        else:
            asyncio.run(test_engine.dispose())
    except Exception:
        pass
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass


@pytest_asyncio.fixture
async def async_client():
    """Create async HTTP client bound to FastAPI application."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

