"""Comprehensive Automated Security, RBAC, and Tenant Isolation Tests."""
import pytest
from uuid import uuid4
from httpx import AsyncClient
from pydantic import ValidationError
from app.core.config import Settings


@pytest.mark.asyncio
async def test_rbac_admin_full_access(async_client: AsyncClient):
    """Verify that an admin user has full operational and administrative permissions."""
    # 1. Fetch Samsung Electronics org and its seeded admin user
    orgs_resp = await async_client.get("/api/v1/organizations")
    samsung_org = next(o for o in orgs_resp.json() if o["slug"] == "samsung")
    admin_user = next(u for u in samsung_org["users"] if u["role"] == "admin")

    headers = {
        "X-Organization-Id": samsung_org["id"],
        "X-User-Id": admin_user["id"],
    }

    # 2. Admin can access audit logs (restricted endpoint)
    audit_resp = await async_client.get("/api/v1/audit", headers=headers)
    assert audit_resp.status_code == 200

    # 3. Admin can create a warehouse (admin-only)
    wh_code = f"WH-SEC-{uuid4().hex[:4].upper()}"
    wh_resp = await async_client.post(
        "/api/v1/warehouses",
        json={"name": "Security Test Warehouse", "code": wh_code, "location": "Test Area"},
        headers=headers,
    )
    assert wh_resp.status_code == 201

    # 4. Admin can add a user to the organization
    new_user_resp = await async_client.post(
        f"/api/v1/organizations/{samsung_org['id']}/users",
        json={"name": "Test Provisioned", "email": f"sec_{uuid4().hex[:6]}@samsung.local", "role": "viewer"},
        headers=headers,
    )
    assert new_user_resp.status_code == 201


@pytest.mark.asyncio
async def test_rbac_warehouse_manager_allowed_and_restricted(async_client: AsyncClient):
    """
    Verify that warehouse_manager can execute logistics/inventory operations,
    but is strictly rejected (HTTP 403) from administrative and financial actions.
    """
    orgs_resp = await async_client.get("/api/v1/organizations")
    samsung_org = next(o for o in orgs_resp.json() if o["slug"] == "samsung")
    wh_user = next(u for u in samsung_org["users"] if u["role"] == "warehouse_manager")

    headers = {
        "X-Organization-Id": samsung_org["id"],
        "X-User-Id": wh_user["id"],
    }

    # ALLOWED: Warehouse manager can query inventory and products
    inv_resp = await async_client.get("/api/v1/inventory", headers=headers)
    assert inv_resp.status_code == 200

    # RESTRICTED 1: Cannot access audit logs
    audit_resp = await async_client.get("/api/v1/audit", headers=headers)
    assert audit_resp.status_code == 403
    assert "Operation not permitted" in audit_resp.json()["detail"]

    # RESTRICTED 2: Cannot create new warehouses
    wh_resp = await async_client.post(
        "/api/v1/warehouses",
        json={"name": "Unauthorized WH", "code": "WH-DENIED", "location": "Denied"},
        headers=headers,
    )
    assert wh_resp.status_code == 403

    # RESTRICTED 3: Cannot add users to organization
    user_resp = await async_client.post(
        f"/api/v1/organizations/{samsung_org['id']}/users",
        json={"name": "Unauthorized User", "email": "denied@samsung.local", "role": "viewer"},
        headers=headers,
    )
    assert user_resp.status_code == 403

    # RESTRICTED 4: Cannot record invoice payments
    pay_resp = await async_client.post(
        "/api/v1/payments",
        json={
            "invoice_id": str(uuid4()),
            "amount": 100.0,
            "payment_method": "UPI",
            "reference": "REF123",
        },
        headers=headers,
    )
    assert pay_resp.status_code == 403


@pytest.mark.asyncio
async def test_rbac_sales_rep_allowed_and_restricted(async_client: AsyncClient):
    """
    Verify that sales_rep can manage customers and sales orders,
    but is strictly rejected (HTTP 403) from inventory movements and warehouse creation.
    """
    orgs_resp = await async_client.get("/api/v1/organizations")
    samsung_org = next(o for o in orgs_resp.json() if o["slug"] == "samsung")
    sales_user = next(u for u in samsung_org["users"] if u["role"] == "sales_rep")

    headers = {
        "X-Organization-Id": samsung_org["id"],
        "X-User-Id": sales_user["id"],
    }

    # ALLOWED: Sales rep can create customers
    cust_resp = await async_client.post(
        "/api/v1/customers",
        json={
            "name": f"Sales Rep Customer {uuid4().hex[:4]}",
            "email": f"rep_cust_{uuid4().hex[:6]}@example.com",
            "phone": "+91 98765 43210",
        },
        headers=headers,
    )
    assert cust_resp.status_code == 201

    # RESTRICTED 1: Cannot manually adjust or move inventory ledger
    prod = (await async_client.get("/api/v1/products", headers=headers)).json()[0]
    wh = (await async_client.get("/api/v1/warehouses", headers=headers)).json()[0]
    inv_move_resp = await async_client.post(
        "/api/v1/inventory/movements",
        json={
            "product_id": prod["id"],
            "warehouse_id": wh["id"],
            "movement_type": "IN_PURCHASE",
            "quantity": 10,
        },
        headers=headers,
    )
    assert inv_move_resp.status_code == 403
    assert "Operation not permitted" in inv_move_resp.json()["detail"]

    # RESTRICTED 2: Cannot trigger background jobs
    job_resp = await async_client.post(
        "/api/v1/jobs/low_stock_scanner/run",
        headers=headers,
    )
    assert job_resp.status_code == 403

    # RESTRICTED 3: Cannot view audit logs
    audit_resp = await async_client.get("/api/v1/audit", headers=headers)
    assert audit_resp.status_code == 403


@pytest.mark.asyncio
async def test_rbac_viewer_read_only_enforced(async_client: AsyncClient):
    """
    Verify that a viewer role can query all resources,
    but is strictly rejected (HTTP 403) on ALL mutating operations.
    """
    orgs_resp = await async_client.get("/api/v1/organizations")
    samsung_org = next(o for o in orgs_resp.json() if o["slug"] == "samsung")
    viewer_user = next(u for u in samsung_org["users"] if u["role"] == "viewer")

    headers = {
        "X-Organization-Id": samsung_org["id"],
        "X-User-Id": viewer_user["id"],
    }

    # ALLOWED: Read-only access works across modules
    assert (await async_client.get("/api/v1/products", headers=headers)).status_code == 200
    assert (await async_client.get("/api/v1/inventory", headers=headers)).status_code == 200
    assert (await async_client.get("/api/v1/orders", headers=headers)).status_code == 200
    assert (await async_client.get("/api/v1/invoices", headers=headers)).status_code == 200
    assert (await async_client.get("/api/v1/shipments", headers=headers)).status_code == 200
    assert (await async_client.get("/api/v1/warehouses", headers=headers)).status_code == 200

    # RESTRICTED 1: Cannot create products
    prod_resp = await async_client.post(
        "/api/v1/products",
        json={"name": "Viewer Prod", "sku": f"VW-{uuid4().hex[:4]}", "unit": "pcs", "price": 10.0},
        headers=headers,
    )
    assert prod_resp.status_code == 403

    # RESTRICTED 2: Cannot create orders
    order_resp = await async_client.post(
        "/api/v1/orders",
        json={"customer_id": str(uuid4()), "items": []},
        headers=headers,
    )
    assert order_resp.status_code == 403

    # RESTRICTED 3: Cannot create invoices
    inv_resp = await async_client.post(
        "/api/v1/invoices",
        json={"customer_id": str(uuid4()), "items": []},
        headers=headers,
    )
    assert inv_resp.status_code == 403


@pytest.mark.asyncio
async def test_cross_tenant_user_masquerading_blocked(async_client: AsyncClient):
    """
    Verify that a user belonging to Organization A cannot masquerade as an operator
    of Organization B (Anti-Masquerading Enforcement).
    """
    orgs_resp = await async_client.get("/api/v1/organizations")
    samsung_org = next(o for o in orgs_resp.json() if o["slug"] == "samsung")
    semi_org = next(o for o in orgs_resp.json() if o["slug"] == "samsung-semi")

    samsung_admin = next(u for u in samsung_org["users"] if u["role"] == "admin")

    # Samsung Electronics user maliciously requests Samsung Semiconductor tenant data using their own User ID
    spoofed_headers = {
        "X-Organization-Id": semi_org["id"],
        "X-User-Id": samsung_admin["id"],
    }

    resp = await async_client.get("/api/v1/products", headers=spoofed_headers)
    assert resp.status_code == 403
    assert "Cross-tenant access forbidden" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_tenant_isolation_reverified_across_modules(async_client: AsyncClient):
    """
    Re-verify that an entity belonging to Organization A is strictly invisible
    and inaccessible to Organization B across all modules.
    """
    orgs_resp = await async_client.get("/api/v1/organizations")
    samsung_org = next(o for o in orgs_resp.json() if o["slug"] == "samsung")
    semi_org = next(o for o in orgs_resp.json() if o["slug"] == "samsung-semi")

    samsung_headers = {"X-Organization-Id": samsung_org["id"]}
    semi_headers = {"X-Organization-Id": semi_org["id"]}

    # 1. Product Isolation
    samsung_prods = (await async_client.get("/api/v1/products", headers=samsung_headers)).json()
    assert len(samsung_prods) > 0
    samsung_prod_id = samsung_prods[0]["id"]

    semi_prod_get = await async_client.get(f"/api/v1/products/{samsung_prod_id}", headers=semi_headers)
    assert semi_prod_get.status_code == 404

    # 2. Warehouse Isolation
    samsung_whs = (await async_client.get("/api/v1/warehouses", headers=samsung_headers)).json()
    assert len(samsung_whs) > 0
    samsung_wh_id = samsung_whs[0]["id"]

    semi_wh_get = await async_client.get(f"/api/v1/warehouses/{samsung_wh_id}", headers=semi_headers)
    assert semi_wh_get.status_code == 404

    # 3. Customer Isolation
    samsung_custs = (await async_client.get("/api/v1/customers", headers=samsung_headers)).json()
    if samsung_custs:
        samsung_cust_id = samsung_custs[0]["id"]
        semi_cust_get = await async_client.get(f"/api/v1/customers/{samsung_cust_id}", headers=semi_headers)
        assert semi_cust_get.status_code == 404


def test_production_config_rejects_dev_secret_key():
    """Verify that Settings validation blocks starting in production with the default dev key."""
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="flowstock-dev-secret-key-change-in-production-only",
        )
    assert "SECRET_KEY must be configured with a secure private key" in str(exc_info.value)
