"""Automated Integration Tests for Phase 10: Operations Dashboard & Analytics."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dashboard_summary_happy_path(async_client: AsyncClient):
    """Verify Samsung Electronics executive dashboard metrics return real calculated data across modules."""
    resp = await async_client.get("/api/v1/analytics/dashboard")
    assert resp.status_code == 200
    data = resp.json()

    assert data["organization_name"] == "Samsung Electronics Ltd"
    assert data["currency"] == "INR"

    # Inventory metrics verification
    inv = data["inventory"]
    assert inv["total_skus"] > 0
    assert inv["total_units_on_hand"] > 0
    assert inv["total_cost_valuation"] > 0
    assert inv["total_retail_valuation"] >= inv["total_cost_valuation"]
    assert isinstance(inv["low_stock_items"], list)

    # Financial & Receivables metrics verification
    fin = data["financials"]
    assert fin["total_invoiced"] > 0
    assert fin["total_collected"] >= 0
    assert fin["total_outstanding"] >= 0
    assert 0.0 <= fin["collection_rate_pct"] <= 100.0
    assert fin["invoices_count"] > 0

    # Sales order pipeline verification
    orders = data["orders"]
    assert orders["total_orders"] > 0
    assert orders["confirmed_count"] + orders["fulfilled_count"] + orders["draft_count"] + orders["cancelled_count"] == orders["total_orders"]

    # Logistics delivery radar verification
    logistics = data["logistics"]
    assert logistics["total_shipments"] > 0
    assert logistics["in_transit_count"] + logistics["delivered_count"] + logistics["preparing_count"] + logistics["cancelled_count"] == logistics["total_shipments"]

    # Purchasing verification
    purchasing = data["purchasing"]
    assert purchasing["total_purchase_orders"] > 0

    # Multi-facility warehouse distribution
    warehouses = data["warehouses"]
    assert len(warehouses) >= 2
    wh_names = [w["name"] for w in warehouses]
    assert "Samsung Noida Mega Plant & Central DC" in wh_names
    for wh in warehouses:
        assert 0.0 <= wh["pct_of_total_stock"] <= 100.0

    # Recent activity stream
    activities = data["recent_activities"]
    assert len(activities) > 0
    valid_types = {"ORDER", "PAYMENT", "SHIPMENT", "INVENTORY"}
    for act in activities:
        assert act["activity_type"] in valid_types
        assert act["title"]
        assert act["description"]
        assert act["timestamp"]


@pytest.mark.asyncio
async def test_dashboard_multitenant_isolation(async_client: AsyncClient):
    """Verify tenant isolation on dashboard queries (Org A metrics vs Org B metrics)."""
    orgs_resp = await async_client.get("/api/v1/organizations")
    assert orgs_resp.status_code == 200
    orgs = orgs_resp.json()

    samsung = next((o for o in orgs if o["slug"] == "samsung"), None)
    semi = next((o for o in orgs if o["slug"] == "samsung-semi"), None)
    assert samsung is not None and semi is not None

    samsung_dash_resp = await async_client.get(
        "/api/v1/analytics/dashboard", headers={"X-Organization-Id": samsung["id"]}
    )
    assert samsung_dash_resp.status_code == 200
    samsung_dash = samsung_dash_resp.json()

    semi_dash_resp = await async_client.get(
        "/api/v1/analytics/dashboard", headers={"X-Organization-Id": semi["id"]}
    )
    assert semi_dash_resp.status_code == 200
    semi_dash = semi_dash_resp.json()

    # Verify tenant names
    assert samsung_dash["organization_name"] == "Samsung Electronics Ltd"
    assert semi_dash["organization_name"] == "Samsung Semiconductor Ltd"

    # Verify warehouses are strictly isolated
    samsung_wh_names = {w["name"] for w in samsung_dash["warehouses"]}
    semi_wh_names = {w["name"] for w in semi_dash["warehouses"]}
    assert "Samsung Noida Mega Plant & Central DC" in samsung_wh_names
    assert "Samsung Noida Mega Plant & Central DC" not in semi_wh_names
    assert "Samsung Giheung Fab & Global Depot" in semi_wh_names
    assert "Samsung Giheung Fab & Global Depot" not in samsung_wh_names


@pytest.mark.asyncio
async def test_dashboard_empty_tenant(async_client: AsyncClient):
    """Verify fresh organization with zero records returns zeroed metrics safely without division-by-zero errors."""
    import uuid
    slug = f"fresh-startup-{uuid.uuid4().hex[:6]}"
    create_resp = await async_client.post(
        "/api/v1/organizations",
        json={"name": "Fresh Startup Inc", "slug": slug, "currency": "INR"},
    )
    assert create_resp.status_code == 201
    fresh_org = create_resp.json()

    dash_resp = await async_client.get(
        "/api/v1/analytics/dashboard", headers={"X-Organization-Id": fresh_org["id"]}
    )
    assert dash_resp.status_code == 200
    dash = dash_resp.json()

    assert dash["organization_name"] == "Fresh Startup Inc"
    assert dash["currency"] == "INR"

    # All metrics should gracefully be 0
    assert dash["inventory"]["total_skus"] == 0
    assert dash["inventory"]["total_units_on_hand"] == 0
    assert dash["inventory"]["total_cost_valuation"] == 0.0
    assert dash["inventory"]["total_retail_valuation"] == 0.0
    assert dash["inventory"]["low_stock_count"] == 0
    assert dash["inventory"]["low_stock_items"] == []

    assert dash["financials"]["total_invoiced"] == 0.0
    assert dash["financials"]["total_collected"] == 0.0
    assert dash["financials"]["total_outstanding"] == 0.0
    assert dash["financials"]["collection_rate_pct"] == 0.0
    assert dash["financials"]["invoices_count"] == 0

    assert dash["orders"]["total_orders"] == 0
    assert dash["orders"]["active_order_book_value"] == 0.0

    assert dash["logistics"]["total_shipments"] == 0
    assert dash["purchasing"]["total_purchase_orders"] == 0
    assert dash["top_products"] == []
    assert dash["warehouses"] == []
    assert dash["recent_activities"] == []
