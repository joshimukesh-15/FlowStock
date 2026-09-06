from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import (
    get_current_tenant_id,
    get_current_user,
    require_warehouse_or_admin,
)
from app.models.user import User
from app.core.database import get_db
from app.schemas.transfer import StockTransferCreate, StockTransferRead
from app.services.warehouse import warehouse_service

router = APIRouter()


@router.get("", response_model=List[StockTransferRead])
async def list_transfers(
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """List all stock transfers for the active tenant."""
    return await warehouse_service.list_transfers(db, organization_id)


@router.post("", response_model=StockTransferRead, status_code=status.HTTP_201_CREATED)
async def create_transfer(
    transfer_in: StockTransferCreate,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Create a new inter-warehouse transfer request (status: REQUESTED)."""
    return await warehouse_service.create_transfer(db, organization_id, transfer_in)


@router.post("/{id}/dispatch", response_model=StockTransferRead)
async def dispatch_transfer(
    id: UUID,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Dispatch transfer goods (REQUESTED -> IN_TRANSIT) and deduct source inventory."""
    return await warehouse_service.dispatch_transfer(db, organization_id, id)


@router.post("/{id}/receive", response_model=StockTransferRead)
async def receive_transfer(
    id: UUID,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Receive transfer goods (IN_TRANSIT -> RECEIVED) and add destination inventory."""
    return await warehouse_service.receive_transfer(db, organization_id, id)


@router.post("/{id}/cancel", response_model=StockTransferRead)
async def cancel_transfer(
    id: UUID,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a transfer in REQUESTED status."""
    return await warehouse_service.cancel_transfer(db, organization_id, id)
