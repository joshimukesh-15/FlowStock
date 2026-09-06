"""Automated Multi-Tenancy Data Isolation Tests."""
import pytest
from uuid import uuid4
from sqlalchemy import Column, String
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.models.base import Base, TenantScopedModel
from app.repositories.base import TenantRepository


class DummyTenantItem(TenantScopedModel):
    """Test model inheriting TenantScopedModel."""
    __tablename__ = "dummy_tenant_items"
    name = Column(String(50), nullable=False)


@pytest.mark.asyncio
async def test_tenant_isolation_repository():
    """Verify that Organization A cannot see Organization B's records."""
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
    repo = TenantRepository(DummyTenantItem)

    org_a = uuid4()
    org_b = uuid4()

    async with session_maker() as session:
        # Create an item in Organization A
        item_a = await repo.create(session, obj_in={"name": "Org A Widget"}, organization_id=org_a)
        assert item_a.id is not None
        assert item_a.organization_id == org_a

        # Attempt to read item_a using Organization B credentials
        cross_tenant_read = await repo.get_by_tenant(session, id=item_a.id, organization_id=org_b)
        assert cross_tenant_read is None, "CRITICAL: Cross-tenant data leak! Org B read Org A record"

        # Correct tenant read succeeds
        correct_tenant_read = await repo.get_by_tenant(session, id=item_a.id, organization_id=org_a)
        assert correct_tenant_read is not None
        assert correct_tenant_read.name == "Org A Widget"

        # List scoped by tenant
        org_b_list = await repo.list_by_tenant(session, organization_id=org_b)
        assert len(org_b_list) == 0, "CRITICAL: Org B listed records belonging to Org A"

    await test_engine.dispose()
