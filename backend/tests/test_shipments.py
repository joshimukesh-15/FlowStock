"""Automated Integration Tests for Phase 8: Shipments & Logistics Tracking."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_shipment_for_confirmed_order(async_client: AsyncClient):
    """Verify creating a shipment for a confirmed order initializes PENDING status and manifest event."""
    orders_resp = await async_client.get("/api/v1/orders")
    assert orders_resp.status_code == 200
    orders = orders_resp.json()
    confirmed_order = next((o for o in orders if o["status"] in ["CONFIRMED", "FULFILLED"]), None)
    assert confirmed_order is not None

    shipment_payload = {
        "order_id": confirmed_order["id"],
        "carrier": "Blue Dart",
        "tracking_number": "BD-TEST-998811",
        "shipping_cost": 1250.00,
        "origin_address": "Central Logistics Facility, Bhiwandi",
        "destination_address": "Industrial Area, Phase 1, Pune, MH",
        "notes": "Urgent spare parts delivery",
    }
    create_resp = await async_client.post("/api/v1/shipments", json=shipment_payload)
    assert create_resp.status_code == 201
    shipment = create_resp.json()

    assert shipment["status"] == "PENDING"
    assert shipment["carrier"] == "Blue Dart"
    assert shipment["tracking_number"] == "BD-TEST-998811"
    assert shipment["shipping_cost"] == 1250.00
    assert shipment["shipment_number"].startswith("SHP-")
    assert len(shipment["events"]) >= 1
    assert shipment["events"][0]["status"] == "PENDING"
    assert "manifested" in shipment["events"][0]["description"].lower()


@pytest.mark.asyncio
async def test_shipment_state_machine_and_timeline_events(async_client: AsyncClient):
    """Verify full logistics lifecycle: PENDING -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED with audit timeline."""
    orders_resp = await async_client.get("/api/v1/orders")
    orders = orders_resp.json()
    order = next(o for o in orders if o["status"] in ["CONFIRMED", "FULFILLED"])

    create_resp = await async_client.post(
        "/api/v1/shipments",
        json={
            "order_id": order["id"],
            "carrier": "Delhivery",
            "shipping_cost": 750.00,
        },
    )
    assert create_resp.status_code == 201
    shp = create_resp.json()
    shp_id = shp["id"]

    # 1. Dispatch shipment (PENDING -> IN_TRANSIT)
    dispatch_resp = await async_client.post(
        f"/api/v1/shipments/{shp_id}/dispatch",
        json={"location": "Bhiwandi Hub", "description": "Package departed warehouse on linehaul"},
    )
    assert dispatch_resp.status_code == 200
    dispatched = dispatch_resp.json()
    assert dispatched["status"] == "IN_TRANSIT"

    # 2. Add intermediate checkpoint scan
    scan_resp = await async_client.post(
        f"/api/v1/shipments/{shp_id}/events",
        json={
            "status": "IN_TRANSIT",
            "location": "Thane Sorting Gateway",
            "description": "Bag sorted and loaded onto vehicle MH-04-1234",
        },
    )
    assert scan_resp.status_code == 201
    event = scan_resp.json()
    assert event["location"] == "Thane Sorting Gateway"

    # 3. Mark Out for Delivery (IN_TRANSIT -> OUT_FOR_DELIVERY)
    ofd_resp = await async_client.post(
        f"/api/v1/shipments/{shp_id}/out-for-delivery",
        json={"location": "Pune Delivery Hub", "description": "Out for delivery with rider"},
    )
    assert ofd_resp.status_code == 200
    ofd = ofd_resp.json()
    assert ofd["status"] == "OUT_FOR_DELIVERY"

    # 4. Mark Delivered (OUT_FOR_DELIVERY -> DELIVERED)
    deliv_resp = await async_client.post(
        f"/api/v1/shipments/{shp_id}/deliver",
        json={"location": "Customer Site", "description": "Received and signed by consignee"},
    )
    assert deliv_resp.status_code == 200
    delivered = deliv_resp.json()
    assert delivered["status"] == "DELIVERED"
    assert delivered["actual_delivery"] is not None

    # Fetch full shipment detail and verify timeline progression
    detail_resp = await async_client.get(f"/api/v1/shipments/{shp_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert len(detail["events"]) >= 4
    statuses = [e["status"] for e in detail["events"]]
    assert "PENDING" in statuses
    assert "IN_TRANSIT" in statuses
    assert "OUT_FOR_DELIVERY" in statuses
    assert "DELIVERED" in statuses


@pytest.mark.asyncio
async def test_cannot_ship_draft_order(async_client: AsyncClient):
    """Verify attempting to create a shipment for an unconfirmed (DRAFT) order fails with HTTP 400."""
    cust_resp = await async_client.get("/api/v1/customers")
    customer = cust_resp.json()[0]

    prod_resp = await async_client.get("/api/v1/products")
    product = prod_resp.json()[0]

    # Create DRAFT order
    order_resp = await async_client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer["id"],
            "notes": "Unconfirmed draft order for testing shipment block",
            "items": [{"product_id": product["id"], "quantity": 1}],
        },
    )
    assert order_resp.status_code == 201
    draft_order = order_resp.json()
    assert draft_order["status"] == "DRAFT"

    # Attempt to ship DRAFT order
    fail_ship_resp = await async_client.post(
        "/api/v1/shipments",
        json={
            "order_id": draft_order["id"],
            "carrier": "DTDC",
        },
    )
    assert fail_ship_resp.status_code == 400
    assert "must be CONFIRMED or FULFILLED" in fail_ship_resp.json()["detail"]


@pytest.mark.asyncio
async def test_cancel_shipment_records_timeline(async_client: AsyncClient):
    """Verify cancelling a shipment sets status to CANCELLED and appends cancellation event."""
    orders_resp = await async_client.get("/api/v1/orders")
    order = next(o for o in orders_resp.json() if o["status"] in ["CONFIRMED", "FULFILLED"])

    create_resp = await async_client.post(
        "/api/v1/shipments",
        json={
            "order_id": order["id"],
            "carrier": "Gati KWE",
            "shipping_cost": 500.00,
        },
    )
    shp_id = create_resp.json()["id"]

    cancel_resp = await async_client.post(
        f"/api/v1/shipments/{shp_id}/cancel",
        json={"location": "Bhiwandi Hub", "description": "Customer requested address change"},
    )
    assert cancel_resp.status_code == 200
    cancelled = cancel_resp.json()
    assert cancelled["status"] == "CANCELLED"

    # Cannot deliver cancelled shipment
    fail_deliver = await async_client.post(f"/api/v1/shipments/{shp_id}/deliver")
    assert fail_deliver.status_code == 400


@pytest.mark.asyncio
async def test_shipments_multi_tenant_isolation(async_client: AsyncClient):
    """Verify Organization B cannot access or modify Organization A shipments."""
    orgs_resp = await async_client.get("/api/v1/organizations")
    orgs = orgs_resp.json()
    acme_id = next(o["id"] for o in orgs if o["slug"] == "acme")
    apex_id = next(o["id"] for o in orgs if o["slug"] == "apex")

    # Acme shipments
    acme_resp = await async_client.get("/api/v1/shipments", headers={"X-Organization-Id": acme_id})
    assert acme_resp.status_code == 200
    acme_shipments = acme_resp.json()
    assert len(acme_shipments) > 0
    acme_shp_id = acme_shipments[0]["id"]
    acme_shp_nums = [s["shipment_number"] for s in acme_shipments]

    # Apex attempts to access Acme shipment by ID
    apex_get_resp = await async_client.get(
        f"/api/v1/shipments/{acme_shp_id}", headers={"X-Organization-Id": apex_id}
    )
    assert apex_get_resp.status_code == 404

    # Apex list shipments does not contain any Acme shipments
    apex_list_resp = await async_client.get("/api/v1/shipments", headers={"X-Organization-Id": apex_id})
    assert apex_list_resp.status_code == 200
    apex_shipments = apex_list_resp.json()
    for s in apex_shipments:
        assert s["shipment_number"] not in acme_shp_nums
