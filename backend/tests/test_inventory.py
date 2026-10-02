"""Automated Tests for Append-Only Inventory Ledger & Multi-Tenancy."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_inventory_summaries_seeded(async_client: AsyncClient):
    """Verify dynamic stock computation, valuations, and low-stock alerts."""
    resp = await async_client.get("/api/v1/inventory")
    assert resp.status_code == 200
    summaries = resp.json()
    assert len(summaries) >= 3

    # Check Galaxy S24 Ultra
    plt = next(s for s in summaries if s["product"]["sku"] == "SMS-S24U-512")
    assert plt["on_hand_quantity"] >= 25
    assert plt["is_low_stock"] is False
    assert plt["total_cost_value"] == plt["on_hand_quantity"] * 105000.0

    # Check Galaxy Buds3 Pro (Low Stock Alert: 15 on hand <= 50 reorder point)
    flm = next(s for s in summaries if s["product"]["sku"] == "SMS-BUDS-3P")
    assert flm["on_hand_quantity"] == 15
    assert flm["is_low_stock"] is True


@pytest.mark.asyncio
async def test_record_movement_in_and_out(async_client: AsyncClient):
    """Verify append-only ledger increases and decreases stock dynamically."""
    # Get Pallet Jack ID -> Galaxy S24 Ultra ID
    inv_resp = await async_client.get("/api/v1/inventory")
    plt = next(s for s in inv_resp.json() if s["product"]["sku"] == "SMS-S24U-512")
    initial_stock = plt["on_hand_quantity"]
    prod_id = plt["product"]["id"]

    # Record Stock IN (+10)
    in_resp = await async_client.post(
        "/api/v1/inventory/movements",
        json={
            "product_id": prod_id,
            "movement_type": "IN",
            "quantity": 10,
            "reference": "Test Inbound Shipment",
            "notes": "Testing stock increase",
        },
    )
    assert in_resp.status_code == 201
    assert in_resp.json()["quantity_change"] == 10

    # Check new on-hand stock is initial + 10
    inv_after_in = await async_client.get("/api/v1/inventory")
    plt_after_in = next(s for s in inv_after_in.json() if s["product"]["id"] == prod_id)
    assert plt_after_in["on_hand_quantity"] == initial_stock + 10

    # Record Stock OUT (-4)
    out_resp = await async_client.post(
        "/api/v1/inventory/movements",
        json={
            "product_id": prod_id,
            "movement_type": "OUT",
            "quantity": 4,
            "reference": "Test Outbound Order",
        },
    )
    assert out_resp.status_code == 201
    assert out_resp.json()["quantity_change"] == -4

    # Check new on-hand stock is initial + 6
    inv_after_out = await async_client.get("/api/v1/inventory")
    plt_after_out = next(s for s in inv_after_out.json() if s["product"]["id"] == prod_id)
    assert plt_after_out["on_hand_quantity"] == initial_stock + 6

    # Verify audit ledger history endpoint
    ledger_resp = await async_client.get(f"/api/v1/inventory/{prod_id}/movements")
    assert ledger_resp.status_code == 200
    movements = ledger_resp.json()
    assert len(movements) >= 3  # Initial + IN + OUT
    refs = [m["reference"] for m in movements]
    assert "Test Inbound Shipment" in refs
    assert "Test Outbound Order" in refs


@pytest.mark.asyncio
async def test_negative_stock_prevented(async_client: AsyncClient):
    """Verify attempting to dispatch more stock than available fails with HTTP 400."""
    inv_resp = await async_client.get("/api/v1/inventory")
    flm = next(s for s in inv_resp.json() if s["product"]["sku"] == "SMS-BUDS-3P")
    current_stock = flm["on_hand_quantity"]
    prod_id = flm["product"]["id"]

    # Attempt to dispatch current_stock + 100
    excessive_qty = current_stock + 100
    fail_resp = await async_client.post(
        "/api/v1/inventory/movements",
        json={
            "product_id": prod_id,
            "movement_type": "OUT",
            "quantity": excessive_qty,
            "reference": "Attempted Over-dispatch",
        },
    )
    assert fail_resp.status_code == 400
    detail = fail_resp.json()["detail"]
    assert "Insufficient stock" in detail
    assert "Negative stock is strictly blocked" in detail


@pytest.mark.asyncio
async def test_adjustment_sets_exact_stock_count(async_client: AsyncClient):
    """Verify stock count adjustment updates ledger with exact differential."""
    inv_resp = await async_client.get("/api/v1/inventory")
    bin_item = next(s for s in inv_resp.json() if s["product"]["sku"] == "SMS-ACC-45W")
    prod_id = bin_item["product"]["id"]

    # Adjust stock count to exactly 42 units
    adj_resp = await async_client.post(
        "/api/v1/inventory/movements",
        json={
            "product_id": prod_id,
            "movement_type": "ADJUSTMENT",
            "quantity": 42,
            "reference": "Physical Wall-to-Wall Audit Count",
        },
    )
    assert adj_resp.status_code == 201

    # Verify new on-hand is exactly 42
    inv_after = await async_client.get("/api/v1/inventory")
    bin_after = next(s for s in inv_after.json() if s["product"]["id"] == prod_id)
    assert bin_after["on_hand_quantity"] == 42


@pytest.mark.asyncio
async def test_inventory_multi_tenant_isolation(async_client: AsyncClient):
    """Verify Organization B sees only its own inventory and cannot view Org A stock."""
    orgs_resp = await async_client.get("/api/v1/organizations")
    orgs = orgs_resp.json()
    samsung_id = next(o["id"] for o in orgs if o["slug"] == "samsung")
    semi_id = next(o["id"] for o in orgs if o["slug"] == "samsung-semi")

    # Samsung Electronics inventory query
    samsung_inv = await async_client.get("/api/v1/inventory", headers={"X-Organization-Id": samsung_id})
    assert samsung_inv.status_code == 200
    samsung_skus = [item["product"]["sku"] for item in samsung_inv.json()]
    assert "SMS-S24U-512" in samsung_skus
    assert "SMS-SSD-2TB" not in samsung_skus

    # Samsung Semiconductor inventory query
    semi_inv = await async_client.get("/api/v1/inventory", headers={"X-Organization-Id": semi_id})
    assert semi_inv.status_code == 200
    semi_skus = [item["product"]["sku"] for item in semi_inv.json()]
    assert "SMS-SSD-2TB" in semi_skus
    assert "SMS-S24U-512" not in semi_skus  # Completely isolated
