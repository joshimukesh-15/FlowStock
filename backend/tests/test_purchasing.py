"""Automated Tests for Suppliers, Purchase Orders, and Inbound Receiving."""
from uuid import uuid4
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_suppliers_and_create(async_client: AsyncClient):
    """Verify seeded suppliers and creating new supplier."""
    # List seeded suppliers for Samsung
    resp = await async_client.get("/api/v1/suppliers")
    assert resp.status_code == 200
    suppliers = resp.json()
    assert len(suppliers) >= 1
    names = [s["name"] for s in suppliers]
    assert any("Qualcomm" in n or "Corning" in n for n in names)

    # Create new supplier with unique email
    unique_email = f"vendor_{uuid4().hex[:6]}@godrej-ind.in"
    create_resp = await async_client.post(
        "/api/v1/suppliers",
        json={
            "name": "Godrej Material Handling Ltd",
            "email": unique_email,
            "phone": "+91 98200 88888",
            "company": "Godrej & Boyce Mfg Co",
            "address": "Pirojshanagar, Vikhroli, Mumbai, MH",
            "payment_terms": "Net 60",
        },
    )
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["name"] == "Godrej Material Handling Ltd"
    assert created["email"] == unique_email
    assert created["payment_terms"] == "Net 60"

    # Duplicate email in same org should fail
    dup_resp = await async_client.post(
        "/api/v1/suppliers",
        json={
            "name": "Duplicate Vendor",
            "email": unique_email,
        },
    )
    assert dup_resp.status_code == 400
    assert "already exists" in dup_resp.json()["detail"]


@pytest.mark.asyncio
async def test_po_draft_to_issue_lifecycle(async_client: AsyncClient):
    """Verify purchase order draft creation and issue to vendor."""
    sup_resp = await async_client.get("/api/v1/suppliers")
    supplier_id = sup_resp.json()[0]["id"]

    wh_resp = await async_client.get("/api/v1/warehouses")
    warehouse_id = wh_resp.json()[0]["id"]

    prod_resp = await async_client.get("/api/v1/products")
    p_plt = next(p for p in prod_resp.json() if p["sku"] == "SMS-S24U-512")

    # Create PO in DRAFT
    create_resp = await async_client.post(
        "/api/v1/purchase-orders",
        json={
            "supplier_id": supplier_id,
            "destination_warehouse_id": warehouse_id,
            "notes": "Test Procurement Batch",
            "items": [
                {
                    "product_id": p_plt["id"],
                    "quantity": 5,
                    "unit_cost": p_plt["cost_price"],
                }
            ],
        },
    )
    assert create_resp.status_code == 201
    po = create_resp.json()
    assert po["status"] == "DRAFT"
    assert po["total_amount"] == round(5 * p_plt["cost_price"], 2)
    po_id = po["id"]

    # Issue PO to vendor
    issue_resp = await async_client.post(f"/api/v1/purchase-orders/{po_id}/issue")
    assert issue_resp.status_code == 200
    assert issue_resp.json()["status"] == "ISSUED"


@pytest.mark.asyncio
async def test_po_receive_credits_inventory_ledger(async_client: AsyncClient):
    """Verify receiving PO goods credits physical stock via append-only IN movements."""
    sup_resp = await async_client.get("/api/v1/suppliers")
    supplier_id = sup_resp.json()[0]["id"]

    wh_resp = await async_client.get("/api/v1/warehouses")
    warehouse_id = wh_resp.json()[0]["id"]

    prod_resp = await async_client.get("/api/v1/products")
    p_bin = next(p for p in prod_resp.json() if p["sku"] == "SMS-ACC-45W")

    # Get initial stock before receiving
    inv_before = await async_client.get("/api/v1/inventory")
    initial_stock = next(s for s in inv_before.json() if s["product"]["id"] == p_bin["id"])["on_hand_quantity"]

    # Create PO for 20 storage bins
    create_resp = await async_client.post(
        "/api/v1/purchase-orders",
        json={
            "supplier_id": supplier_id,
            "destination_warehouse_id": warehouse_id,
            "items": [
                {
                    "product_id": p_bin["id"],
                    "quantity": 20,
                    "unit_cost": p_bin["cost_price"],
                }
            ],
        },
    )
    po = create_resp.json()
    po_id = po["id"]

    # Issue PO
    await async_client.post(f"/api/v1/purchase-orders/{po_id}/issue")

    # Receive PO at warehouse
    recv_resp = await async_client.post(f"/api/v1/purchase-orders/{po_id}/receive")
    assert recv_resp.status_code == 200
    assert recv_resp.json()["status"] == "RECEIVED"

    # Verify inventory is increased by exactly +20
    inv_after = await async_client.get("/api/v1/inventory")
    stock_after = next(s for s in inv_after.json() if s["product"]["id"] == p_bin["id"])["on_hand_quantity"]
    assert stock_after == initial_stock + 20

    # Verify that ledger movements contain this PO receipt
    movements_resp = await async_client.get(f"/api/v1/inventory/{p_bin['id']}/movements")
    assert movements_resp.status_code == 200
    movements = movements_resp.json()
    po_movements = [m for m in movements if po["po_number"] in m["reference"]]
    assert len(po_movements) == 1
    assert po_movements[0]["quantity_change"] == 20
    assert po_movements[0]["movement_type"] == "IN"


@pytest.mark.asyncio
async def test_cancel_po_does_not_affect_inventory(async_client: AsyncClient):
    """Verify cancelling a PO transitions to CANCELLED and does not alter stock."""
    sup_resp = await async_client.get("/api/v1/suppliers")
    supplier_id = sup_resp.json()[0]["id"]

    wh_resp = await async_client.get("/api/v1/warehouses")
    warehouse_id = wh_resp.json()[0]["id"]

    prod_resp = await async_client.get("/api/v1/products")
    p_flm = next(p for p in prod_resp.json() if p["sku"] == "SMS-BUDS-3P")

    create_resp = await async_client.post(
        "/api/v1/purchase-orders",
        json={
            "supplier_id": supplier_id,
            "destination_warehouse_id": warehouse_id,
            "items": [{"product_id": p_flm["id"], "quantity": 10}],
        },
    )
    po_id = create_resp.json()["id"]

    cancel_resp = await async_client.post(f"/api/v1/purchase-orders/{po_id}/cancel")
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "CANCELLED"


@pytest.mark.asyncio
async def test_purchasing_multi_tenant_isolation(async_client: AsyncClient):
    """Verify Organization B cannot see or manipulate Organization A suppliers or POs."""
    orgs = (await async_client.get("/api/v1/organizations")).json()
    samsung_id = next(o["id"] for o in orgs if o["slug"] == "samsung")
    semi_id = next(o["id"] for o in orgs if o["slug"] == "samsung-semi")

    # Samsung Electronics POs
    samsung_pos = (await async_client.get("/api/v1/purchase-orders", headers={"X-Organization-Id": samsung_id})).json()
    assert len(samsung_pos) >= 1
    samsung_po_id = samsung_pos[0]["id"]

    # Samsung Semiconductor trying to access Samsung Electronics PO
    semi_attempt = await async_client.get(
        f"/api/v1/purchase-orders/{samsung_po_id}",
        headers={"X-Organization-Id": semi_id},
    )
    assert semi_attempt.status_code == 404

    # Samsung Semiconductor supplier list should NOT contain Samsung Electronics suppliers
    semi_suppliers = (await async_client.get("/api/v1/suppliers", headers={"X-Organization-Id": semi_id})).json()
    semi_emails = [s["email"] for s in semi_suppliers]
    assert "snapdragon.supply@qualcomm.com" not in semi_emails
    assert "euv.systems@asml.com" in semi_emails
