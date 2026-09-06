"""Automated Tests for Organizations and Multi-Tenant Switching."""
import pytest
from uuid import uuid4
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_organizations_seeded(async_client: AsyncClient):
    """Verify initial seeded demo organizations exist."""
    response = await async_client.get("/api/v1/organizations")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    slugs = [org["slug"] for org in data]
    assert "acme" in slugs
    assert "apex" in slugs


@pytest.mark.asyncio
async def test_create_organization_and_auto_admin(async_client: AsyncClient):
    """Verify creating an organization automatically generates an admin user."""
    unique_suffix = str(uuid4())[:8]
    new_org_payload = {
        "name": f"Beacon Supply {unique_suffix}",
        "slug": f"beacon-{unique_suffix}",
        "currency": "GBP",
    }
    response = await async_client.post("/api/v1/organizations", json=new_org_payload)
    assert response.status_code == 201
    created_org = response.json()
    assert created_org["name"] == new_org_payload["name"]
    assert created_org["currency"] == "GBP"

    # Verify auto-created admin user
    users_resp = await async_client.get(f"/api/v1/organizations/{created_org['id']}/users")
    assert users_resp.status_code == 200
    users = users_resp.json()
    assert len(users) == 1
    assert users[0]["role"] == "admin"


@pytest.mark.asyncio
async def test_duplicate_slug_rejected(async_client: AsyncClient):
    """Verify organization slug uniqueness is enforced."""
    dup_payload = {
        "name": "Acme Duplicate",
        "slug": "acme",
        "currency": "USD",
    }
    response = await async_client.post("/api/v1/organizations", json=dup_payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]
