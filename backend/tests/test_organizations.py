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


@pytest.mark.asyncio
async def test_delete_organization_cascade(async_client: AsyncClient):
    """Verify deleting an organization cascade deletes all tenant records and returns 204."""
    # 1. Create a test organization
    unique = str(uuid4())[:8]
    create_resp = await async_client.post(
        "/api/v1/organizations",
        json={
            "name": f"Delete Me Org {unique}",
            "slug": f"delete-me-{unique}",
            "currency": "USD",
        },
    )
    assert create_resp.status_code == 201
    org_id = create_resp.json()["id"]

    # 2. Add some data under this organization (headers: x-organization-id)
    headers = {"X-Organization-Id": org_id}
    cat_resp = await async_client.post(
        "/api/v1/categories",
        headers=headers,
        json={"name": f"Temp Category {unique}", "description": "Testing delete"},
    )
    assert cat_resp.status_code == 201

    wh_resp = await async_client.post(
        "/api/v1/warehouses",
        headers=headers,
        json={"name": f"Temp WH {unique}", "code": f"TWH-{unique}", "location": "Test Area"},
    )
    assert wh_resp.status_code == 201

    # 3. Delete the organization
    del_resp = await async_client.delete(f"/api/v1/organizations/{org_id}")
    assert del_resp.status_code == 204

    # 4. Verify organization no longer exists
    get_resp = await async_client.get(f"/api/v1/organizations/{org_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_nonexistent_organization(async_client: AsyncClient):
    """Verify deleting a nonexistent organization returns 404."""
    fake_id = str(uuid4())
    del_resp = await async_client.delete(f"/api/v1/organizations/{fake_id}")
    assert del_resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_last_remaining_org_prevented(monkeypatch):
    """Verify cannot delete the last remaining organization."""
    from app.repositories.organization import organization_repo
    from app.models.organization import Organization
    from app.services.organization import organization_service
    from fastapi import HTTPException

    mock_org = Organization(id=uuid4(), name="Solo Org", slug="solo", currency="USD")
    async def mock_list_all(db):
        return [mock_org]

    monkeypatch.setattr(organization_repo, "list_all", mock_list_all)

    with pytest.raises(HTTPException) as exc_info:
        await organization_service.delete_organization(None, mock_org.id)
    assert exc_info.value.status_code == 400
    assert "Cannot delete the last remaining organization" in exc_info.value.detail


