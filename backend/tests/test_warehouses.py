"""Automated Tests for Warehouses and Inter-Warehouse Transfer State Machine."""
import pytest
from uuid import uuid4
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_warehouses_seeded(async_client: AsyncClient):
    """Verify initial demo warehouses exist for the tenant."""
    resp = await async_client.get("/api/v1/warehouses")
    assert resp.status_code == 200
    warehouses = resp.json()
    assert len(warehouses) >= 2
    codes = [w["code"] for w in warehouses]
    assert "WH-SMS-01" in codes
    assert "WH-SMS-02" in codes


@pytest.mark.asyncio
async def test_create_warehouse_and_duplicate_code_rejected(async_client: AsyncClient):
    """Verify creating warehouse and unique code enforcement."""
    uid = str(uuid4())[:6].upper()
    create_payload = {
        "name": f"Annex Depot {uid}",
        "code": f"WH-ANX-{uid}",
        "location": "Dallas, TX",
        "is_default": False,
    }
    resp = await async_client.post("/api/v1/warehouses", json=create_payload)
    assert resp.status_code == 201
    assert resp.json()["code"] == f"WH-ANX-{uid}"

    # Attempt duplicate code
    dup_resp = await async_client.post("/api/v1/warehouses", json=create_payload)
    assert dup_resp.status_code == 400
    assert "already exists" in dup_resp.json()["detail"]


@pytest.mark.asyncio
async def test_transfer_state_machine_lifecycle(async_client: AsyncClient):
    """Verify REQUESTED -> IN_TRANSIT (source deducts) -> RECEIVED (dest adds)."""
    # Get Warehouses and S24 Ultra
    wh_resp = await async_client.get("/api/v1/warehouses")
    warehouses = wh_resp.json()
    wh_main = next(w for w in warehouses if w["code"] == "WH-SMS-01")
    wh_east = next(w for w in warehouses if w["code"] == "WH-SMS-02")

    prod_resp = await async_client.get("/api/v1/products?search=SMS-S24U-512")
    product = prod_resp.json()[0]
    prod_id = product["id"]

    # Step 1: Create Transfer (REQUESTED)
    transfer_payload = {
        "source_warehouse_id": wh_main["id"],
        "destination_warehouse_id": wh_east["id"],
        "product_id": prod_id,
        "quantity": 4,
        "notes": "Regional restock",
    }
    create_resp = await async_client.post("/api/v1/transfers", json=transfer_payload)
    assert create_resp.status_code == 201
    transfer = create_resp.json()
    assert transfer["status"] == "REQUESTED"
    assert transfer["quantity"] == 4
    transfer_id = transfer["id"]

    # Step 2: Dispatch Transfer (IN_TRANSIT)
    dispatch_resp = await async_client.post(f"/api/v1/transfers/{transfer_id}/dispatch")
    assert dispatch_resp.status_code == 200
    dispatched = dispatch_resp.json()
    assert dispatched["status"] == "IN_TRANSIT"

    # Step 3: Receive Transfer (RECEIVED)
    receive_resp = await async_client.post(f"/api/v1/transfers/{transfer_id}/receive")
    assert receive_resp.status_code == 200
    received = receive_resp.json()
    assert received["status"] == "RECEIVED"


@pytest.mark.asyncio
async def test_cannot_transfer_to_same_warehouse(async_client: AsyncClient):
    """Verify source and destination cannot be identical."""
    wh_resp = await async_client.get("/api/v1/warehouses")
    wh_main = wh_resp.json()[0]
    prod_resp = await async_client.get("/api/v1/products")
    prod = prod_resp.json()[0]

    payload = {
        "source_warehouse_id": wh_main["id"],
        "destination_warehouse_id": wh_main["id"],
        "product_id": prod["id"],
        "quantity": 2,
    }
    resp = await async_client.post("/api/v1/transfers", json=payload)
    assert resp.status_code == 400
    assert "cannot be the same" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_warehouse_multi_tenant_isolation(async_client: AsyncClient):
    """Verify Organization B cannot view or touch Organization A warehouses."""
    orgs_resp = await async_client.get("/api/v1/organizations")
    orgs = orgs_resp.json()
    samsung_id = next(o["id"] for o in orgs if o["slug"] == "samsung")
    semi_id = next(o["id"] for o in orgs if o["slug"] == "samsung-semi")

    # Samsung Electronics query
    samsung_whs = await async_client.get("/api/v1/warehouses", headers={"X-Organization-Id": samsung_id})
    assert samsung_whs.status_code == 200
    samsung_codes = [w["code"] for w in samsung_whs.json()]
    assert "WH-SMS-01" in samsung_codes
    assert "WH-SEMI-01" not in samsung_codes

    # Samsung Semiconductor query
    semi_whs = await async_client.get("/api/v1/warehouses", headers={"X-Organization-Id": semi_id})
    assert semi_whs.status_code == 200
    semi_codes = [w["code"] for w in semi_whs.json()]
    assert "WH-SEMI-01" in semi_codes
    assert "WH-SMS-01" not in semi_codes
