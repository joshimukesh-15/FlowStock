"""Automated Tests for Products and Categories with Multi-Tenant Isolation."""
import pytest
from uuid import uuid4
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_seeded_products_and_categories(async_client: AsyncClient):
    """Verify initial demo products and categories are returned for default tenant."""
    # List categories
    cat_resp = await async_client.get("/api/v1/categories")
    assert cat_resp.status_code == 200
    categories = cat_resp.json()
    assert len(categories) >= 2
    cat_names = [c["name"] for c in categories]
    assert "Smartphones & Foldables" in cat_names

    # List products
    prod_resp = await async_client.get("/api/v1/products")
    assert prod_resp.status_code == 200
    products = prod_resp.json()
    assert len(products) >= 3
    skus = [p["sku"] for p in products]
    assert "SMS-S24U-512" in skus


@pytest.mark.asyncio
async def test_create_and_update_product(async_client: AsyncClient):
    """Verify full CRUD operations for products."""
    uid = str(uuid4())[:8]
    # Create category with unique name
    cat_resp = await async_client.post(
        "/api/v1/categories",
        json={"name": f"Safety Gear {uid}", "description": "PPE equipment"},
    )
    assert cat_resp.status_code == 201
    cat_id = cat_resp.json()["id"]

    # Create product
    prod_payload = {
        "name": f"Hi-Vis Safety Vest {uid}",
        "sku": f"SKU-VEST-{uid}",
        "unit": "pcs",
        "price": 14.99,
        "cost_price": 5.25,
        "reorder_point": 20,
        "category_id": cat_id,
    }
    prod_resp = await async_client.post("/api/v1/products", json=prod_payload)
    assert prod_resp.status_code == 201
    product = prod_resp.json()
    assert product["name"] == prod_payload["name"]
    assert product["price"] == 14.99
    assert product["category"]["name"] == f"Safety Gear {uid}"
    prod_id = product["id"]

    # Update product
    update_payload = {"price": 16.50, "reorder_point": 25}
    update_resp = await async_client.put(f"/api/v1/products/{prod_id}", json=update_payload)
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["price"] == 16.50
    assert updated["reorder_point"] == 25

    # Delete product
    del_resp = await async_client.delete(f"/api/v1/products/{prod_id}")
    assert del_resp.status_code == 204


@pytest.mark.asyncio
async def test_search_and_filter_products(async_client: AsyncClient):
    """Verify keyword search and category filtering work correctly."""
    # Search by SKU
    resp = await async_client.get("/api/v1/products?search=SMS-ACC-45W")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["sku"] == "SMS-ACC-45W"

    # Search by name keyword
    resp_name = await async_client.get("/api/v1/products?search=Galaxy")
    assert resp_name.status_code == 200
    items_name = resp_name.json()
    assert len(items_name) >= 2


@pytest.mark.asyncio
async def test_duplicate_sku_rejected_in_same_org(async_client: AsyncClient):
    """Verify duplicate SKU creation fails with HTTP 400."""
    payload = {
        "name": "Duplicate Item",
        "sku": "SMS-S24U-512",  # Already exists in Samsung Electronics
        "unit": "pcs",
        "price": 100.0,
    }
    resp = await async_client.post("/api/v1/products", json=payload)
    assert resp.status_code == 400
    assert "already exists" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_multi_tenant_product_isolation(async_client: AsyncClient):
    """Verify Organization B cannot see or manipulate Organization A products."""
    # Get all organizations
    orgs_resp = await async_client.get("/api/v1/organizations")
    orgs = orgs_resp.json()
    samsung_id = next(o["id"] for o in orgs if o["slug"] == "samsung")
    semi_id = next(o["id"] for o in orgs if o["slug"] == "samsung-semi")

    # Samsung Electronics query with explicit header
    samsung_products_resp = await async_client.get(
        "/api/v1/products",
        headers={"X-Organization-Id": samsung_id},
    )
    samsung_skus = [p["sku"] for p in samsung_products_resp.json()]
    assert "SMS-S24U-512" in samsung_skus
    assert "SMS-SSD-2TB" not in samsung_skus

    # Samsung Semiconductor query with explicit header
    semi_products_resp = await async_client.get(
        "/api/v1/products",
        headers={"X-Organization-Id": semi_id},
    )
    semi_skus = [p["sku"] for p in semi_products_resp.json()]
    assert "SMS-SSD-2TB" in semi_skus
    assert "SMS-S24U-512" not in semi_skus  # Provably isolated!
