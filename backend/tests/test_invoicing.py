"""Automated Integration Tests for Phase 9: Invoicing and Payments."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_invoice_and_calculate_gst(async_client: AsyncClient):
    """Verify creating a B2B invoice calculates line subtotals, 18% GST, and initial balance due."""
    cust_resp = await async_client.get("/api/v1/customers")
    assert cust_resp.status_code == 200
    customer = cust_resp.json()[0]

    prod_resp = await async_client.get("/api/v1/products")
    products = prod_resp.json()
    p1 = products[0]
    p2 = products[1] if len(products) > 1 else products[0]

    invoice_payload = {
        "customer_id": customer["id"],
        "tax_rate": 18.0,
        "notes": "Custom engineering supplies consignment",
        "items": [
            {
                "description": p1["name"],
                "quantity": 3,
                "unit_price": 250.00,
                "product_id": p1["id"],
            },
            {
                "description": p2["name"],
                "quantity": 2,
                "unit_price": 100.00,
                "product_id": p2["id"],
            },
        ],
    }

    create_resp = await async_client.post("/api/v1/invoices", json=invoice_payload)
    assert create_resp.status_code == 201
    inv = create_resp.json()

    assert inv["invoice_number"].startswith("INV-")
    assert inv["subtotal"] == 950.00  # 3*250 + 2*100 = 750 + 200 = 950
    assert inv["tax_rate"] == 18.0
    assert inv["tax_amount"] == 171.00  # 950 * 0.18 = 171.00
    assert inv["total_amount"] == 1121.00
    assert inv["paid_amount"] == 0.0
    assert inv["balance_due"] == 1121.00
    assert inv["status"] == "ISSUED"
    assert len(inv["items"]) == 2


@pytest.mark.asyncio
async def test_create_invoice_from_sales_order(async_client: AsyncClient):
    """Verify generating an invoice directly from an existing confirmed sales order."""
    orders_resp = await async_client.get("/api/v1/orders")
    orders = orders_resp.json()
    confirmed_order = next((o for o in orders if o["status"] in ["CONFIRMED", "FULFILLED"]), None)
    assert confirmed_order is not None

    gen_resp = await async_client.post(f"/api/v1/invoices/from-order/{confirmed_order['id']}?tax_rate=18.0")
    assert gen_resp.status_code == 201
    inv = gen_resp.json()

    assert inv["order_id"] == confirmed_order["id"]
    assert inv["customer_id"] == confirmed_order["customer_id"]
    assert inv["status"] == "ISSUED"
    assert inv["subtotal"] == confirmed_order["total_amount"]
    expected_tax = round(confirmed_order["total_amount"] * 0.18, 2)
    assert inv["tax_amount"] == expected_tax
    assert inv["total_amount"] == round(confirmed_order["total_amount"] + expected_tax, 2)
    assert inv["balance_due"] == inv["total_amount"]
    assert len(inv["items"]) == len(confirmed_order["items"])


@pytest.mark.asyncio
async def test_record_full_payment_marks_invoice_paid(async_client: AsyncClient):
    """Verify applying exact full payment transitions invoice to PAID with zero balance due."""
    cust_resp = await async_client.get("/api/v1/customers")
    customer = cust_resp.json()[0]

    create_resp = await async_client.post(
        "/api/v1/invoices",
        json={
            "customer_id": customer["id"],
            "tax_rate": 18.0,
            "items": [{"description": "Standard Pallet Bin", "quantity": 10, "unit_price": 50.00}],
        },
    )
    assert create_resp.status_code == 201
    inv = create_resp.json()
    inv_id = inv["id"]
    total_to_pay = inv["total_amount"]

    # Record full payment
    pay_resp = await async_client.post(
        "/api/v1/payments",
        json={
            "invoice_id": inv_id,
            "amount": total_to_pay,
            "payment_method": "BANK_TRANSFER",
            "reference": "UTR-TEST-8823101",
            "notes": "Full electronic wire clearance",
        },
    )
    assert pay_resp.status_code == 201
    paid_inv = pay_resp.json()

    assert paid_inv["paid_amount"] == total_to_pay
    assert paid_inv["balance_due"] == 0.0
    assert paid_inv["status"] == "PAID"
    assert len(paid_inv["payments"]) == 1
    assert paid_inv["payments"][0]["reference"] == "UTR-TEST-8823101"


@pytest.mark.asyncio
async def test_record_partial_payment_marks_partially_paid(async_client: AsyncClient):
    """Verify partial payments increment paid_amount, decrement balance_due, and set PARTIALLY_PAID."""
    cust_resp = await async_client.get("/api/v1/customers")
    customer = cust_resp.json()[0]

    create_resp = await async_client.post(
        "/api/v1/invoices",
        json={
            "customer_id": customer["id"],
            "tax_rate": 0.0,  # 0% tax for simple arithmetic
            "items": [{"description": "Bulk Packaging Rolls", "quantity": 10, "unit_price": 100.00}],
        },
    )
    inv = create_resp.json()
    assert inv["total_amount"] == 1000.00
    inv_id = inv["id"]

    # Step 1: Pay 400.00
    pay1_resp = await async_client.post(
        "/api/v1/payments",
        json={
            "invoice_id": inv_id,
            "amount": 400.00,
            "payment_method": "UPI",
            "reference": "UPI-400-TEST",
        },
    )
    assert pay1_resp.status_code == 201
    inv_after_pay1 = pay1_resp.json()
    assert inv_after_pay1["paid_amount"] == 400.00
    assert inv_after_pay1["balance_due"] == 600.00
    assert inv_after_pay1["status"] == "PARTIALLY_PAID"

    # Step 2: Pay remaining 600.00
    pay2_resp = await async_client.post(
        "/api/v1/payments",
        json={
            "invoice_id": inv_id,
            "amount": 600.00,
            "payment_method": "CHEQUE",
            "reference": "CHQ-600-TEST",
        },
    )
    assert pay2_resp.status_code == 201
    inv_after_pay2 = pay2_resp.json()
    assert inv_after_pay2["paid_amount"] == 1000.00
    assert inv_after_pay2["balance_due"] == 0.0
    assert inv_after_pay2["status"] == "PAID"
    assert len(inv_after_pay2["payments"]) == 2


@pytest.mark.asyncio
async def test_payment_cannot_exceed_outstanding_balance(async_client: AsyncClient):
    """Verify attempting to record a payment higher than outstanding balance fails with HTTP 400."""
    cust_resp = await async_client.get("/api/v1/customers")
    customer = cust_resp.json()[0]

    create_resp = await async_client.post(
        "/api/v1/invoices",
        json={
            "customer_id": customer["id"],
            "tax_rate": 18.0,
            "items": [{"description": "Small order item", "quantity": 1, "unit_price": 50.00}],
        },
    )
    inv = create_resp.json()
    inv_id = inv["id"]
    balance = inv["balance_due"]

    # Attempt to overpay
    overpay_resp = await async_client.post(
        "/api/v1/payments",
        json={
            "invoice_id": inv_id,
            "amount": balance + 500.00,
            "payment_method": "BANK_TRANSFER",
            "reference": "UTR-OVERPAY",
        },
    )
    assert overpay_resp.status_code == 400
    assert "exceeds outstanding balance" in overpay_resp.json()["detail"]


@pytest.mark.asyncio
async def test_cannot_pay_void_invoice(async_client: AsyncClient):
    """Verify voided invoices reject payment attempts with HTTP 400."""
    cust_resp = await async_client.get("/api/v1/customers")
    customer = cust_resp.json()[0]

    create_resp = await async_client.post(
        "/api/v1/invoices",
        json={
            "customer_id": customer["id"],
            "tax_rate": 18.0,
            "items": [{"description": "Cancelled consulting job", "quantity": 1, "unit_price": 200.00}],
        },
    )
    inv_id = create_resp.json()["id"]

    # Void invoice
    void_resp = await async_client.post(f"/api/v1/invoices/{inv_id}/void")
    assert void_resp.status_code == 200
    assert void_resp.json()["status"] == "VOID"

    # Payment attempt must be rejected
    fail_pay = await async_client.post(
        "/api/v1/payments",
        json={
            "invoice_id": inv_id,
            "amount": 100.00,
            "payment_method": "CASH",
            "reference": "REF-CASH",
        },
    )
    assert fail_pay.status_code == 400


@pytest.mark.asyncio
async def test_invoicing_multi_tenant_isolation(async_client: AsyncClient):
    """Verify Organization B cannot access or record payments against Organization A invoices."""
    orgs_resp = await async_client.get("/api/v1/organizations")
    orgs = orgs_resp.json()
    samsung_id = next(o["id"] for o in orgs if o["slug"] == "samsung")
    semi_id = next(o["id"] for o in orgs if o["slug"] == "samsung-semi")

    # Samsung Electronics invoices
    samsung_resp = await async_client.get("/api/v1/invoices", headers={"X-Organization-Id": samsung_id})
    assert samsung_resp.status_code == 200
    samsung_invoices = samsung_resp.json()
    assert len(samsung_invoices) > 0
    samsung_inv_id = samsung_invoices[0]["id"]
    samsung_inv_nums = [i["invoice_number"] for i in samsung_invoices]

    # Samsung Semiconductor attempts to access Samsung Electronics invoice by ID
    semi_get_resp = await async_client.get(
        f"/api/v1/invoices/{samsung_inv_id}", headers={"X-Organization-Id": semi_id}
    )
    assert semi_get_resp.status_code == 404

    # Samsung Semiconductor attempts to pay Samsung Electronics invoice
    semi_pay_resp = await async_client.post(
        "/api/v1/payments",
        json={
            "invoice_id": samsung_inv_id,
            "amount": 100.00,
            "payment_method": "UPI",
            "reference": "UPI-HACK-ATTEMPT",
        },
        headers={"X-Organization-Id": semi_id},
    )
    assert semi_pay_resp.status_code == 404

    # Samsung Semiconductor list invoices does not contain any Samsung Electronics invoices
    semi_list_resp = await async_client.get("/api/v1/invoices", headers={"X-Organization-Id": semi_id})
    assert semi_list_resp.status_code == 200
    semi_invoices = semi_list_resp.json()
    for inv in semi_invoices:
        assert inv["invoice_number"] not in samsung_inv_nums
