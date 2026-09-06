"""Comprehensive End-to-End Business Lifecycle Test Suite (Phase 14).

Mandated by Section 8 of FLOWSTOCK_MASTER_SPEC.md:
"The full end-to-end workflow (signup → org → product → warehouse → inventory →
 customer → order → pick → ship → invoice → payment) must eventually be covered by
 an end-to-end test before the project is considered feature-complete."
"""
import pytest
from uuid import uuid4
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_full_business_lifecycle_e2e(async_client: AsyncClient):
    """
    Test the complete uninterrupted enterprise operational workflow end-to-end:
    1. Organization & Admin signup
    2. Category & Product catalog setup
    3. Warehouse creation
    4. Append-only inventory stock-in ledger movement
    5. B2B Customer creation
    6. Sales Order draft creation
    7. Order confirmation with stock reservation check
    8. Order fulfillment (pick/pack) with ledger deduction
    9. Outbound logistics shipment dispatch & delivery
    10. Tax Invoice generation with 18% GST calculation in ₹ INR
    11. Payment recording and complete accounts receivable settlement
    12. Operational compliance verification: Audit Log, Notifications & Analytics
    """
    unique = str(uuid4())[:8]

    # --- STEP 1: Organization & Admin Signup ---
    org_payload = {
        "name": f"Reliance Nexus Logistics {unique}",
        "slug": f"nexus-{unique}",
        "currency": "INR",
    }
    org_res = await async_client.post("/api/v1/organizations", json=org_payload)
    assert org_res.status_code == 201, org_res.text
    org = org_res.json()
    org_id = org["id"]
    headers = {"X-Organization-Id": org_id}

    # Verify auto-provisioned admin
    users_res = await async_client.get(f"/api/v1/organizations/{org_id}/users")
    assert users_res.status_code == 200, users_res.text
    assert len(users_res.json()) >= 1
    assert users_res.json()[0]["role"] == "admin"

    # --- STEP 2: Category & Product Setup ---
    cat_payload = {
        "name": f"Industrial Packaging {unique}",
        "description": "Heavy-duty corrugated boxes and protective materials",
    }
    cat_res = await async_client.post("/api/v1/categories", json=cat_payload, headers=headers)
    assert cat_res.status_code == 201, cat_res.text
    category = cat_res.json()

    prod_payload = {
        "name": "Reinforced Export Grade Pallet Box",
        "sku": f"SKU-BOX-{unique.upper()}",
        "category_id": category["id"],
        "cost_price": 450.0,
        "price": 850.0,
        "unit": "box",
        "reorder_point": 20,
    }
    prod_res = await async_client.post("/api/v1/products", json=prod_payload, headers=headers)
    assert prod_res.status_code == 201, prod_res.text
    product = prod_res.json()
    product_id = product["id"]

    # --- STEP 3: Warehouse Setup ---
    wh_payload = {
        "name": f"Bhiwandi Central Fulfillment {unique}",
        "code": f"BHW-{unique.upper()}",
        "location": "Bhiwandi, Maharashtra",
        "is_default": True,
    }
    wh_res = await async_client.post("/api/v1/warehouses", json=wh_payload, headers=headers)
    assert wh_res.status_code == 201, wh_res.text
    warehouse = wh_res.json()
    warehouse_id = warehouse["id"]

    # --- STEP 4: Inventory Ledger (Stock-In) ---
    stock_in_payload = {
        "product_id": product_id,
        "warehouse_id": warehouse_id,
        "movement_type": "IN",
        "quantity": 100,
        "reference": "Initial Inward Consignment #PO-REC-001",
        "notes": "Verified dock intake count",
    }
    move_res = await async_client.post("/api/v1/inventory/movements", json=stock_in_payload, headers=headers)
    assert move_res.status_code == 201, move_res.text

    # Verify inventory summary: 100 units on hand
    inv_res = await async_client.get("/api/v1/inventory", headers=headers)
    assert inv_res.status_code == 200, inv_res.text
    summaries = inv_res.json()
    our_stock = next((s for s in summaries if s["product"]["id"] == product_id), None)
    assert our_stock is not None
    assert our_stock["on_hand_quantity"] == 100
    assert our_stock["total_cost_value"] == 45000.0  # 100 * 450.0

    # --- STEP 5: Customer Creation ---
    cust_payload = {
        "name": "Tata Advanced Systems Ltd",
        "email": f"purchase-{unique}@tata.com",
        "phone": "+91 98200 11223",
        "company": "Tata Group",
        "address": "MIDC Industrial Area, Pune 411018",
    }
    cust_res = await async_client.post("/api/v1/customers", json=cust_payload, headers=headers)
    assert cust_res.status_code == 201, cust_res.text
    customer = cust_res.json()
    customer_id = customer["id"]

    # --- STEP 6: Sales Order (Draft) ---
    order_payload = {
        "customer_id": customer_id,
        "warehouse_id": warehouse_id,
        "items": [{"product_id": product_id, "quantity": 30}],
        "notes": "Priority order for Pune manufacturing line",
    }
    order_res = await async_client.post("/api/v1/orders", json=order_payload, headers=headers)
    assert order_res.status_code == 201, order_res.text
    order = order_res.json()
    assert order["status"] == "DRAFT"
    assert order["total_amount"] == 25500.0  # 30 * 850.0
    order_id = order["id"]

    # --- STEP 7: Order Confirmation & Inventory Reservation ---
    confirm_res = await async_client.post(f"/api/v1/orders/{order_id}/confirm", headers=headers)
    assert confirm_res.status_code == 200, confirm_res.text
    confirmed_order = confirm_res.json()
    assert confirmed_order["status"] == "CONFIRMED"

    # --- STEP 8: Order Fulfillment (Pick, Pack & Deduct Stock) ---
    fulfill_res = await async_client.post(f"/api/v1/orders/{order_id}/fulfill", headers=headers)
    assert fulfill_res.status_code == 200, fulfill_res.text
    fulfilled_order = fulfill_res.json()
    assert fulfilled_order["status"] == "FULFILLED"

    # Verify physical stock reduced via append-only ledger: 100 - 30 = 70 units
    inv_after = await async_client.get("/api/v1/inventory", headers=headers)
    assert inv_after.status_code == 200
    our_stock_after = next((s for s in inv_after.json() if s["product"]["id"] == product_id), None)
    assert our_stock_after["on_hand_quantity"] == 70

    # --- STEP 9: Outbound Shipment & Logistics Delivery ---
    shipment_payload = {
        "order_id": order_id,
        "carrier": "BlueDart Express",
        "tracking_number": f"BD-{unique.upper()}-9912",
        "shipping_cost": 450.0,
        "destination_address": "MIDC Industrial Area, Pune 411018",
        "notes": "Fragile consignment, signature required",
    }
    ship_res = await async_client.post("/api/v1/shipments", json=shipment_payload, headers=headers)
    assert ship_res.status_code == 201, ship_res.text
    shipment = ship_res.json()
    assert shipment["status"] == "PENDING"
    shipment_id = shipment["id"]

    # Dispatch to transit
    dispatch_res = await async_client.post(
        f"/api/v1/shipments/{shipment_id}/dispatch",
        json={"location": "Bhiwandi Hub", "description": "Loaded onto Pune linehaul vehicle"},
        headers=headers,
    )
    assert dispatch_res.status_code == 200, dispatch_res.text
    assert dispatch_res.json()["status"] == "IN_TRANSIT"

    # Complete delivery
    deliver_res = await async_client.post(
        f"/api/v1/shipments/{shipment_id}/deliver",
        json={"location": "Tata Receiving Gate 4", "description": "Signed by security guard #4401"},
        headers=headers,
    )
    assert deliver_res.status_code == 200, deliver_res.text
    assert deliver_res.json()["status"] == "DELIVERED"

    # --- STEP 10: Tax Invoice Generation (18% GST in ₹ INR) ---
    inv_gen_res = await async_client.post(
        f"/api/v1/invoices/from-order/{order_id}?tax_rate=18.0",
        headers=headers,
    )
    assert inv_gen_res.status_code == 201, inv_gen_res.text
    invoice = inv_gen_res.json()
    assert invoice["status"] == "ISSUED"
    assert invoice["subtotal"] == 25500.0
    assert invoice["tax_amount"] == 4590.0  # 18% of 25500
    assert invoice["total_amount"] == 30090.0  # 25500 + 4590
    assert invoice["balance_due"] == 30090.0
    invoice_id = invoice["id"]

    # --- STEP 11: Payment Recording & Settlement ---
    payment_payload = {
        "invoice_id": invoice_id,
        "amount": 30090.0,
        "payment_method": "BANK_TRANSFER",
        "reference": f"UTR-TATA-{unique.upper()}-01",
        "notes": "Full RTGS settlement for PO-7721",
    }
    pay_res = await async_client.post("/api/v1/payments", json=payment_payload, headers=headers)
    assert pay_res.status_code == 201, pay_res.text
    paid_invoice = pay_res.json()
    assert paid_invoice["status"] == "PAID"
    assert paid_invoice["paid_amount"] == 30090.0
    assert paid_invoice["balance_due"] == 0.0

    # --- STEP 12: Compliance, Audit & Analytics Verification ---
    # Verify Audit logs captured every step
    audit_res = await async_client.get("/api/v1/audit", headers=headers)
    assert audit_res.status_code == 200, audit_res.text
    audit_actions = [a["action"] for a in audit_res.json()]
    assert "ORDER_CONFIRMED" in audit_actions
    assert "ORDER_FULFILLED" in audit_actions
    assert "SHIPMENT_DELIVERED" in audit_actions
    assert "PAYMENT_RECORDED" in audit_actions

    # Verify Notifications were generated
    notif_res = await async_client.get("/api/v1/notifications", headers=headers)
    assert notif_res.status_code == 200, notif_res.text
    notif_titles = [n["title"] for n in notif_res.json()]
    assert any("Order Confirmed" in t for t in notif_titles)
    assert any("Order Fulfilled" in t for t in notif_titles)
    assert any("Shipment Delivered" in t for t in notif_titles)
    assert any("Payment Received" in t for t in notif_titles)

    # Verify Analytics Cockpit reflects the completed business cycle
    analytics_res = await async_client.get("/api/v1/analytics/dashboard", headers=headers)
    assert analytics_res.status_code == 200, analytics_res.text
    analytics_data = analytics_res.json()
    assert analytics_data["organization_name"] == org_payload["name"]
    assert analytics_data["currency"] == "INR"
    assert analytics_data["financials"]["total_invoiced"] >= 30090.0
    assert analytics_data["financials"]["total_collected"] >= 30090.0
    assert analytics_data["orders"]["fulfilled_count"] >= 1
    assert analytics_data["logistics"]["delivered_count"] >= 1


@pytest.mark.asyncio
async def test_e2e_business_integrity_invariants(async_client: AsyncClient):
    """
    Verify core business rules, edge cases and multi-tenant security invariants:
    1. Insufficient inventory blocks order confirmation
    2. Direct negative stock deduction beyond available inventory is rejected
    3. Overpayment exceeding invoice balance is rejected
    4. Cross-tenant order modification attempt is strictly denied (HTTP 404)
    """
    unique_a = str(uuid4())[:8]
    unique_b = str(uuid4())[:8]

    # Create Org A
    org_a_res = await async_client.post(
        "/api/v1/organizations",
        json={"name": f"Org Alpha {unique_a}", "slug": f"alpha-{unique_a}", "currency": "INR"},
    )
    assert org_a_res.status_code == 201
    org_a_id = org_a_res.json()["id"]
    headers_a = {"X-Organization-Id": org_a_id}

    # Create Org B
    org_b_res = await async_client.post(
        "/api/v1/organizations",
        json={"name": f"Org Beta {unique_b}", "slug": f"beta-{unique_b}", "currency": "INR"},
    )
    assert org_b_res.status_code == 201
    org_b_id = org_b_res.json()["id"]
    headers_b = {"X-Organization-Id": org_b_id}

    # Setup Org A catalog & warehouse
    cat_res = await async_client.post("/api/v1/categories", json={"name": "Tools"}, headers=headers_a)
    assert cat_res.status_code == 201
    cat_id = cat_res.json()["id"]

    prod_res = await async_client.post(
        "/api/v1/products",
        json={"name": "Torque Wrench", "sku": f"SKU-TW-{unique_a}", "category_id": cat_id, "cost_price": 500, "price": 1200},
        headers=headers_a,
    )
    assert prod_res.status_code == 201
    prod_id = prod_res.json()["id"]

    wh_res = await async_client.post(
        "/api/v1/warehouses",
        json={"name": "Alpha Wh", "code": f"WH-A-{unique_a}"},
        headers=headers_a,
    )
    assert wh_res.status_code == 201
    wh_id = wh_res.json()["id"]

    # Stock-in 10 units
    in_res = await async_client.post(
        "/api/v1/inventory/movements",
        json={"product_id": prod_id, "warehouse_id": wh_id, "movement_type": "IN", "quantity": 10},
        headers=headers_a,
    )
    assert in_res.status_code == 201

    cust_res = await async_client.post(
        "/api/v1/customers",
        json={"name": "Customer X", "email": "x@cust.com"},
        headers=headers_a,
    )
    assert cust_res.status_code == 201
    cust_id = cust_res.json()["id"]

    # --- INVARIANT 1: Order for 15 units exceeds on-hand (10) -> Confirmation BLOCKED ---
    big_order_res = await async_client.post(
        "/api/v1/orders",
        json={"customer_id": cust_id, "warehouse_id": wh_id, "items": [{"product_id": prod_id, "quantity": 15}]},
        headers=headers_a,
    )
    assert big_order_res.status_code == 201
    big_order_id = big_order_res.json()["id"]

    confirm_fail = await async_client.post(f"/api/v1/orders/{big_order_id}/confirm", headers=headers_a)
    assert confirm_fail.status_code == 400
    assert "Insufficient available stock" in confirm_fail.json()["detail"]

    # --- INVARIANT 2: Direct deduction of 50 units (current: 10) -> BLOCKED ---
    neg_stock_res = await async_client.post(
        "/api/v1/inventory/movements",
        json={"product_id": prod_id, "movement_type": "OUT", "quantity": 50},
        headers=headers_a,
    )
    assert neg_stock_res.status_code == 400
    assert "Negative stock is strictly blocked" in neg_stock_res.json()["detail"]

    # --- INVARIANT 3: Valid order (5 units), Invoice generated, Overpayment BLOCKED ---
    valid_order_res = await async_client.post(
        "/api/v1/orders",
        json={"customer_id": cust_id, "warehouse_id": wh_id, "items": [{"product_id": prod_id, "quantity": 5}]},
        headers=headers_a,
    )
    assert valid_order_res.status_code == 201
    valid_order_id = valid_order_res.json()["id"]

    valid_confirm = await async_client.post(f"/api/v1/orders/{valid_order_id}/confirm", headers=headers_a)
    assert valid_confirm.status_code == 200, valid_confirm.text

    inv_res = await async_client.post(f"/api/v1/invoices/from-order/{valid_order_id}?tax_rate=0.0", headers=headers_a)
    assert inv_res.status_code == 201, inv_res.text
    invoice_id = inv_res.json()["id"]

    # Total invoice balance: 5 * 1200 = 6000. Attempt payment of 10000 -> BLOCKED
    overpay_res = await async_client.post(
        "/api/v1/payments",
        json={"invoice_id": invoice_id, "amount": 10000.0, "payment_method": "CASH", "reference": "CASH-OVERPAY-01"},
        headers=headers_a,
    )
    assert overpay_res.status_code == 400
    assert "exceeds outstanding balance" in overpay_res.json()["detail"]

    # --- INVARIANT 4: Tenant B attempting to access or modify Tenant A's order/invoice -> 404 ---
    cross_order = await async_client.get(f"/api/v1/orders/{valid_order_id}", headers=headers_b)
    assert cross_order.status_code == 404

    cross_confirm = await async_client.post(f"/api/v1/orders/{valid_order_id}/cancel", headers=headers_b)
    assert cross_confirm.status_code == 404

    cross_inv = await async_client.get(f"/api/v1/invoices/{invoice_id}", headers=headers_b)
    assert cross_inv.status_code == 404
