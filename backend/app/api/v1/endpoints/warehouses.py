"""Warehouse Endpoints."""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_tenant_id, get_current_user, require_admin
from app.models.user import User
from app.core.database import get_db
from app.schemas.warehouse import WarehouseCreate, WarehouseRead
from app.services.warehouse import warehouse_service

router = APIRouter()


@router.get("", response_model=List[WarehouseRead])
async def list_warehouses(
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """List all warehouses for the active tenant."""
    return await warehouse_service.list_warehouses(db, organization_id)


@router.post("", response_model=WarehouseRead, status_code=status.HTTP_201_CREATED)
async def create_warehouse(
    warehouse_in: WarehouseCreate,
    current_user: User = Depends(require_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Create a new warehouse for the active tenant (Admin only)."""
    return await warehouse_service.create_warehouse(db, organization_id, warehouse_in)


@router.get("/{id}", response_model=WarehouseRead)
async def get_warehouse(
    id: UUID,
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Get warehouse details by ID."""
    return await warehouse_service.get_warehouse(db, organization_id, id)
