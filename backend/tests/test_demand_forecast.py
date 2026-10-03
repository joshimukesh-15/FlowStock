"""Automated Integration Tests for Industrial Demand Forecasting & Algorithmic Replenishment."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_demand_forecast_seeded(async_client: AsyncClient):
    """Verify algorithmic demand forecasting returns calculated run-rates and stockout risks."""
    resp = await async_client.get("/api/v1/analytics/demand-forecast")
    assert resp.status_code == 200
    data = resp.json()

    assert "critical_count" in data
    assert "warning_count" in data
    assert "healthy_count" in data
    assert "avg_days_of_inventory" in data
    assert "total_reorder_capital_required" in data
    assert isinstance(data["items"], list)
    assert len(data["items"]) >= 3

    # Check Galaxy S24 Ultra item
    s24 = next((i for i in data["items"] if i["sku"] == "SMS-S24U-512"), None)
    assert s24 is not None
    assert s24["available_stock"] > 0
    assert s24["daily_velocity"] > 0
    assert s24["reorder_point"] > 0
    assert s24["stockout_risk"] in ("CRITICAL", "WARNING", "HEALTHY", "OVERSTOCKED")

    # Check Galaxy Buds3 Pro (depleted seed stock <= reorder point)
    buds = next((i for i in data["items"] if i["sku"] == "SMS-BUDS-3P"), None)
    assert buds is not None
    assert buds["stockout_risk"] in ("CRITICAL", "WARNING")
    assert buds["suggested_reorder_qty"] >= 10
    assert buds["projected_reorder_cost"] > 0


@pytest.mark.asyncio
async def test_auto_draft_purchase_order(async_client: AsyncClient):
    """Verify 1-click automated purchase order draft generation for depleted inventory."""
    # 1. Fetch forecast to get an at-risk product
    forecast_resp = await async_client.get("/api/v1/analytics/demand-forecast")
    assert forecast_resp.status_code == 200
    forecast = forecast_resp.json()
    target_item = forecast["items"][0]

    # 2. Trigger auto-draft PO
    draft_resp = await async_client.post(
        "/api/v1/analytics/demand-forecast/auto-draft-po",
        json={
            "product_id": target_item["product_id"],
            "quantity": 25,
        },
    )
    assert draft_resp.status_code == 200
    draft_data = draft_resp.json()

    assert draft_data["po_id"]
    assert draft_data["po_number"].startswith("PO-")
    assert draft_data["quantity"] == 25
    assert draft_data["status"] == "DRAFT"
    assert "Successfully drafted" in draft_data["message"]

    # 3. Verify PO appears in standard purchase orders endpoint
    pos_resp = await async_client.get("/api/v1/purchase-orders")
    assert pos_resp.status_code == 200
    all_pos = pos_resp.json()
    assert any(p["id"] == draft_data["po_id"] for p in all_pos)


@pytest.mark.asyncio
async def test_demand_forecast_multi_tenant_isolation(async_client: AsyncClient):
    """Verify demand forecasting telemetry is strictly isolated across tenants."""
    orgs_resp = await async_client.get("/api/v1/organizations")
    assert orgs_resp.status_code == 200
    orgs = orgs_resp.json()
    samsung_id = next(o["id"] for o in orgs if o["slug"] == "samsung")
    semi_id = next(o["id"] for o in orgs if o["slug"] == "samsung-semi")

    # Samsung Electronics forecast
    samsung_fc = await async_client.get(
        "/api/v1/analytics/demand-forecast",
        headers={"X-Organization-Id": samsung_id},
    )
    assert samsung_fc.status_code == 200
    samsung_skus = {i["sku"] for i in samsung_fc.json()["items"]}
    assert "SMS-S24U-512" in samsung_skus
    assert "SMS-SSD-2TB" not in samsung_skus

    # Samsung Semiconductor forecast
    semi_fc = await async_client.get(
        "/api/v1/analytics/demand-forecast",
        headers={"X-Organization-Id": semi_id},
    )
    assert semi_fc.status_code == 200
    semi_skus = {i["sku"] for i in semi_fc.json()["items"]}
    assert "SMS-SSD-2TB" in semi_skus
    assert "SMS-S24U-512" not in semi_skus
