"""Inventory Management Endpoints."""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_tenant_id, get_current_user, require_warehouse_or_admin
from app.models.user import User
from app.core.database import get_db
from app.schemas.inventory import (
    InventoryMovementCreate,
    InventoryMovementRead,
    ProductStockSummary,
)
from app.services.inventory import inventory_service

router = APIRouter()


@router.get("", response_model=List[ProductStockSummary])
async def list_inventory_summaries(
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """List stock levels, low stock alerts, and valuation for all products."""
    return await inventory_service.list_inventory_summaries(db, organization_id)


@router.post("/movements", response_model=InventoryMovementRead, status_code=status.HTTP_201_CREATED)
async def record_inventory_movement(
    movement_in: InventoryMovementCreate,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Record an append-only stock movement (IN, OUT, or ADJUSTMENT)."""
    return await inventory_service.record_movement(db, organization_id, movement_in)


@router.get("/{product_id}/movements", response_model=List[InventoryMovementRead])
async def list_product_movements(
    product_id: UUID,
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Get full chronological movement audit ledger for a specific product."""
    return await inventory_service.list_movements(db, organization_id, product_id)
