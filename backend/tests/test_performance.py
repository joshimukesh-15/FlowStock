"""Performance, N+1 Query Elimination, and Database Index Verification Test Suite."""
import pytest
import time
from uuid import uuid4
from sqlalchemy import select, event

from app.core.database import AsyncSessionLocal, get_active_engine
from app.models.base import Base
from app.models.organization import Organization
from app.models.catalog import Product
from app.models.inventory import InventoryMovement
from app.models.order import SalesOrder
from app.models.invoice import Invoice
from app.models.audit import AuditLog
from app.models.notification import Notification
from app.repositories.inventory import inventory_repo
from app.repositories.catalog import product_repo
from app.repositories.analytics import analytics_repo
from app.services.inventory import inventory_service


@pytest.mark.asyncio
async def test_database_compound_indexes_registered():
    """Verify that all critical compound indexes are registered in SQLAlchemy model metadata."""
    # 1. InventoryMovement table indexes
    mov_table = Base.metadata.tables["inventory_movements"]
    mov_idx_names = {idx.name for idx in mov_table.indexes}
    assert "ix_movements_org_product" in mov_idx_names
    assert "ix_movements_org_warehouse" in mov_idx_names
    assert "ix_movements_org_created" in mov_idx_names

    # Verify column composition of ix_movements_org_product
    idx_org_prod = next(idx for idx in mov_table.indexes if idx.name == "ix_movements_org_product")
    cols = [c.name for c in idx_org_prod.columns]
    assert cols == ["organization_id", "product_id"]

    # 2. SalesOrder table indexes
    order_table = Base.metadata.tables["sales_orders"]
    order_idx_names = {idx.name for idx in order_table.indexes}
    assert "ix_sales_orders_org_status" in order_idx_names
    assert "ix_sales_orders_org_customer" in order_idx_names
    assert "ix_sales_orders_org_created" in order_idx_names

    # 3. Invoice table indexes
    inv_table = Base.metadata.tables["invoices"]
    inv_idx_names = {idx.name for idx in inv_table.indexes}
    assert "ix_invoices_org_status" in inv_idx_names
    assert "ix_invoices_org_customer" in inv_idx_names
    assert "ix_invoices_org_due_date" in inv_idx_names
    assert "ix_invoices_org_created" in inv_idx_names

    # 4. AuditLog table indexes
    audit_table = Base.metadata.tables["audit_logs"]
    audit_idx_names = {idx.name for idx in audit_table.indexes}
    assert "ix_audit_org_created" in audit_idx_names
    assert "ix_audit_org_entity" in audit_idx_names
    assert "ix_audit_org_action" in audit_idx_names

    # 5. Notification table indexes
    notif_table = Base.metadata.tables["notifications"]
    notif_idx_names = {idx.name for idx in notif_table.indexes}
    assert "ix_notifications_org_read_created" in notif_idx_names


@pytest.mark.asyncio
async def test_n_plus_1_query_elimination_in_inventory_summaries():
    """Verify that listing inventory summaries emits exactly 2 queries regardless of product count."""
    async with AsyncSessionLocal() as session:
        # Create isolated organization
        org = Organization(
            name=f"Perf Test Org {uuid4().hex[:6]}",
            slug=f"perf-{uuid4().hex[:6]}",
        )
        session.add(org)
        await session.commit()
        await session.refresh(org)

        # Seed 6 products for this organization
        products = []
        for i in range(6):
            p = Product(
                organization_id=org.id,
                name=f"Perf Item {i}",
                sku=f"PERF-SKU-{i}-{uuid4().hex[:4]}",
                price=150.0 + i * 10,
                cost_price=90.0 + i * 5,
                reorder_point=15,
            )
            session.add(p)
            products.append(p)
        await session.commit()

        # Add multiple movements across products
        for p in products:
            m = InventoryMovement(
                organization_id=org.id,
                product_id=p.id,
                movement_type="IN",
                quantity_change=50,
                reference="Initial Batch",
            )
            session.add(m)
        await session.commit()

    # Query counter listener
    query_count = 0

    def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        nonlocal query_count
        # Count only SELECT queries
        if statement.strip().upper().startswith("SELECT"):
            query_count += 1

    engine = await get_active_engine()
    sync_engine = engine.sync_engine
    event.listen(sync_engine, "before_cursor_execute", before_cursor_execute)

    try:
        async with AsyncSessionLocal() as session:
            # Call list_inventory_summaries
            summaries = await inventory_service.list_inventory_summaries(session, org.id)

            # Assert results
            assert len(summaries) == 6
            for s in summaries:
                assert s.on_hand_quantity == 50
                assert s.is_low_stock is False
                assert s.total_retail_value > 0

            # CRITICAL ASSERTION:
            # In an N+1 implementation, this would emit 1 + 6 = 7 queries.
            # With single-query aggregation (get_all_stock_levels), it emits EXACTLY 2 SELECT queries!
            assert query_count == 2, f"Expected exactly 2 queries, but {query_count} were executed!"
    finally:
        event.remove(sync_engine, "before_cursor_execute", before_cursor_execute)


@pytest.mark.asyncio
async def test_get_all_stock_levels_multi_tenant_isolation():
    """Verify that get_all_stock_levels strictly isolates stock between tenants."""
    async with AsyncSessionLocal() as session:
        # Tenant A
        org_a = Organization(name=f"Tenant A {uuid4().hex[:4]}", slug=f"tenant-a-{uuid4().hex[:4]}")
        # Tenant B
        org_b = Organization(name=f"Tenant B {uuid4().hex[:4]}", slug=f"tenant-b-{uuid4().hex[:4]}")
        session.add_all([org_a, org_b])
        await session.commit()
        await session.refresh(org_a)
        await session.refresh(org_b)

        # Product in A
        prod_a = Product(organization_id=org_a.id, name="Prod A", sku=f"SKU-A-{uuid4().hex[:4]}", price=100.0)
        # Product in B
        prod_b = Product(organization_id=org_b.id, name="Prod B", sku=f"SKU-B-{uuid4().hex[:4]}", price=200.0)
        session.add_all([prod_a, prod_b])
        await session.commit()

        # Movements in A
        session.add(InventoryMovement(
            organization_id=org_a.id,
            product_id=prod_a.id,
            movement_type="IN",
            quantity_change=120,
            reference="PO-A",
        ))
        # Movements in B
        session.add(InventoryMovement(
            organization_id=org_b.id,
            product_id=prod_b.id,
            movement_type="IN",
            quantity_change=450,
            reference="PO-B",
        ))
        await session.commit()

        # Verify Tenant A stock map
        stock_map_a = await inventory_repo.get_all_stock_levels(session, organization_id=org_a.id)
        assert prod_a.id in stock_map_a
        assert stock_map_a[prod_a.id] == 120
        assert prod_b.id not in stock_map_a

        # Verify Tenant B stock map
        stock_map_b = await inventory_repo.get_all_stock_levels(session, organization_id=org_b.id)
        assert prod_b.id in stock_map_b
        assert stock_map_b[prod_b.id] == 450
        assert prod_a.id not in stock_map_b


@pytest.mark.asyncio
async def test_analytics_dashboard_benchmarks():
    """Benchmark operational analytics aggregations and confirm sub-100ms execution times."""
    async with AsyncSessionLocal() as session:
        org = Organization(name=f"Analytics Perf Org {uuid4().hex[:4]}", slug=f"analytics-perf-{uuid4().hex[:4]}")
        session.add(org)
        await session.commit()
        await session.refresh(org)

        # Measure inventory metrics
        t0 = time.perf_counter()
        inv_metrics = await analytics_repo.get_inventory_metrics(session, org.id)
        t_inv = (time.perf_counter() - t0) * 1000

        # Measure financial metrics
        t1 = time.perf_counter()
        fin_metrics = await analytics_repo.get_financial_metrics(session, org.id)
        t_fin = (time.perf_counter() - t1) * 1000

        # Measure order metrics
        t2 = time.perf_counter()
        ord_metrics = await analytics_repo.get_order_metrics(session, org.id)
        t_ord = (time.perf_counter() - t2) * 1000

        assert inv_metrics is not None
        assert fin_metrics is not None
        assert ord_metrics is not None

        # Performance expectation: each query under 100ms in local SQLite/Postgres
        assert t_inv < 100.0, f"Inventory metrics query too slow: {t_inv:.2f}ms"
        assert t_fin < 100.0, f"Financial metrics query too slow: {t_fin:.2f}ms"
        assert t_ord < 100.0, f"Order metrics query too slow: {t_ord:.2f}ms"
