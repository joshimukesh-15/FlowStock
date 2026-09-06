"""Automated Health & Status Tests."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_endpoint(async_client: AsyncClient):
    """Test public root welcome endpoint."""
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "FlowStock" in data["message"]
    assert data["version"] == "0.1.0"


@pytest.mark.asyncio
async def test_health_check_endpoint(async_client: AsyncClient):
    """Test health check returns API, cache and DB status structures."""
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["app"] == "FlowStock"
    assert "cache" in data
    assert data["cache"]["status"] == "healthy"
    assert "database" in data
