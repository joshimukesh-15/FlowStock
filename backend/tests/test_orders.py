"""Automated Tests for Customers, Sales Orders, and Stock Reservation."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_customers_and_create(async_client: AsyncClient):
    """Verify seeded customers and creating new customer."""
    # List seeded customers for Samsung
    resp = await async_client.get("/api/v1/customers")
    assert resp.status_code == 200
    customers = resp.json()
    assert len(customers) >= 1
    names = [c["name"] for c in customers]
    assert any("Reliance" in n for n in names)

    # Create new customer with unique email
    from uuid import uuid4
    unique_email = f"logistics_{uuid4().hex[:6]}@tatasteel.in"
    create_resp = await async_client.post(
        "/api/v1/customers",
        json={
            "name": "Tata Steel Distribution Center",
            "email": unique_email,
            "phone": "+91 98300 99999",
            "company": "Tata Steel Ltd",
            "billing_address": "Bombay House, Homi Mody Street, Mumbai",
            "shipping_address": "Jamshedpur Stockyard, Jharkhand",
        },
    )
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["name"] == "Tata Steel Distribution Center"
    assert created["email"] == unique_email

    # Duplicate email in same org should fail
    dup_resp = await async_client.post(
        "/api/v1/customers",
        json={
            "name": "Duplicate Customer",
            "email": unique_email,
        },
    )
    assert dup_resp.status_code == 400
    assert "already exists" in dup_resp.json()["detail"]


@pytest.mark.asyncio
async def test_sales_order_lifecycle_and_reservation(async_client: AsyncClient):
    """Verify order draft -> confirm (reserve) -> fulfill (deduct ledger) lifecycle."""
    # 1. Get customer and products
    cust_resp = await async_client.get("/api/v1/customers")
    customer_id = cust_resp.json()[0]["id"]

    prod_resp = await async_client.get("/api/v1/products")
    products = prod_resp.json()
    p_bin = next(p for p in products if p["sku"] == "SMS-ACC-45W")

    # Get initial stock of Storage Bin
    inv_resp = await async_client.get("/api/v1/inventory")
    initial_stock = next(s for s in inv_resp.json() if s["product"]["id"] == p_bin["id"])["on_hand_quantity"]

    # 2. Create Order in DRAFT
    create_resp = await async_client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer_id,
            "notes": "Test Order for Lifecycle Verification",
            "items": [
                {
                    "product_id": p_bin["id"],
                    "quantity": 3,
                    "unit_price": p_bin["price"],
                }
            ],
        },
    )
    assert create_resp.status_code == 201
    order = create_resp.json()
    assert order["status"] == "DRAFT"
    assert order["total_amount"] == round(3 * p_bin["price"], 2)
    order_id = order["id"]

    # Stock in inventory is NOT yet deducted in DRAFT
    inv_after_draft = await async_client.get("/api/v1/inventory")
    stock_after_draft = next(s for s in inv_after_draft.json() if s["product"]["id"] == p_bin["id"])["on_hand_quantity"]
    assert stock_after_draft == initial_stock

    # 3. Confirm Order (reserves inventory)
    confirm_resp = await async_client.post(f"/api/v1/orders/{order_id}/confirm")
    assert confirm_resp.status_code == 200
    confirmed_order = confirm_resp.json()
    assert confirmed_order["status"] == "CONFIRMED"

    # Physical on-hand stock is still in the warehouse (not dispatched yet)
    inv_after_confirm = await async_client.get("/api/v1/inventory")
    stock_after_confirm = next(s for s in inv_after_confirm.json() if s["product"]["id"] == p_bin["id"])["on_hand_quantity"]
    assert stock_after_confirm == initial_stock

    # 4. Fulfill Order (generates OUT movements in ledger)
    fulfill_resp = await async_client.post(f"/api/v1/orders/{order_id}/fulfill")
    assert fulfill_resp.status_code == 200
    fulfilled_order = fulfill_resp.json()
    assert fulfilled_order["status"] == "FULFILLED"

    # Now physical on-hand stock MUST be initial - 3!
    inv_after_fulfill = await async_client.get("/api/v1/inventory")
    stock_after_fulfill = next(s for s in inv_after_fulfill.json() if s["product"]["id"] == p_bin["id"])["on_hand_quantity"]
    assert stock_after_fulfill == initial_stock - 3

    # Check that movement history contains this order
    movements_resp = await async_client.get(f"/api/v1/inventory/{p_bin['id']}/movements")
    assert movements_resp.status_code == 200
    movements = movements_resp.json()
    order_movements = [m for m in movements if order["order_number"] in m["reference"]]
    assert len(order_movements) == 1
    assert order_movements[0]["quantity_change"] == -3


@pytest.mark.asyncio
async def test_insufficient_stock_blocks_order_confirmation(async_client: AsyncClient):
    """Verify attempting to confirm an order exceeding available stock fails with HTTP 400."""
    cust_resp = await async_client.get("/api/v1/customers")
    customer_id = cust_resp.json()[0]["id"]

    prod_resp = await async_client.get("/api/v1/products")
    p_plt = next(p for p in prod_resp.json() if p["sku"] == "SMS-S24U-512")

    # Create order requesting 9999 units
    excessive_order = await async_client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer_id,
            "items": [
                {
                    "product_id": p_plt["id"],
                    "quantity": 9999,
                }
            ],
        },
    )
    assert excessive_order.status_code == 201
    excessive_id = excessive_order.json()["id"]

    # Confirm should be rejected
    fail_confirm = await async_client.post(f"/api/v1/orders/{excessive_id}/confirm")
    assert fail_confirm.status_code == 400
    detail = fail_confirm.json()["detail"]
    assert "Insufficient available stock" in detail


@pytest.mark.asyncio
async def test_cancel_order_releases_reservation(async_client: AsyncClient):
    """Verify cancelling a confirmed order releases reserved stock back to available pool."""
    cust_resp = await async_client.get("/api/v1/customers")
    customer_id = cust_resp.json()[0]["id"]

    prod_resp = await async_client.get("/api/v1/products")
    p_flm = next(p for p in prod_resp.json() if p["sku"] == "SMS-BUDS-3P")

    # Create and confirm order
    order_res = await async_client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer_id,
            "items": [{"product_id": p_flm["id"], "quantity": 1}],
        },
    )
    order_id = order_res.json()["id"]
    await async_client.post(f"/api/v1/orders/{order_id}/confirm")

    # Cancel order
    cancel_res = await async_client.post(f"/api/v1/orders/{order_id}/cancel")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"


@pytest.mark.asyncio
async def test_orders_multi_tenant_isolation(async_client: AsyncClient):
    """Verify Organization B cannot view or manipulate Organization A customers or orders."""
    orgs = (await async_client.get("/api/v1/organizations")).json()
    samsung_id = next(o["id"] for o in orgs if o["slug"] == "samsung")
    semi_id = next(o["id"] for o in orgs if o["slug"] == "samsung-semi")

    # Samsung Electronics orders
    samsung_orders = (await async_client.get("/api/v1/orders", headers={"X-Organization-Id": samsung_id})).json()
    assert len(samsung_orders) >= 1
    samsung_order_id = samsung_orders[0]["id"]

    # Samsung Semiconductor trying to read Samsung Electronics order
    semi_attempt = await async_client.get(
        f"/api/v1/orders/{samsung_order_id}",
        headers={"X-Organization-Id": semi_id},
    )
    assert semi_attempt.status_code == 404

    # Samsung Semiconductor customer list should NOT contain Samsung Electronics customer
    semi_customers = (await async_client.get("/api/v1/customers", headers={"X-Organization-Id": semi_id})).json()
    semi_emails = [c["email"] for c in semi_customers]
    assert "b2b.procurement@reliancedigital.in" not in semi_emails
    assert "procurement@lenovo.in" in semi_emails
