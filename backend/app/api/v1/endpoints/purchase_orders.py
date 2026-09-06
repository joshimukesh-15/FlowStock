"""Purchase Order Endpoints."""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import (
    get_current_tenant_id,
    get_current_user,
    require_warehouse_or_admin,
)
from app.models.user import User
from app.core.database import get_db
from app.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderRead
from app.repositories.purchase_order import purchase_order_repo
from app.services.purchase_order import purchase_order_service

router = APIRouter()


@router.get("", response_model=List[PurchaseOrderRead])
async def list_purchase_orders(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: DRAFT, ISSUED, RECEIVED, CANCELLED"),
    supplier_id: Optional[UUID] = Query(None, description="Filter by supplier ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """List all purchase orders for the active organization."""
    return await purchase_order_repo.list_pos(
        db,
        organization_id=organization_id,
        status=status_filter,
        supplier_id=supplier_id,
        skip=skip,
        limit=limit,
    )


@router.post("", response_model=PurchaseOrderRead, status_code=status.HTTP_201_CREATED)
async def create_purchase_order(
    po_in: PurchaseOrderCreate,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Create a new purchase order in DRAFT status."""
    return await purchase_order_service.create_po(
        db, organization_id=organization_id, obj_in=po_in
    )


@router.get("/{id}", response_model=PurchaseOrderRead)
async def get_purchase_order(
    id: UUID,
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Get full purchase order details with line items and vendor info."""
    po = await purchase_order_repo.get_po_detail(db, organization_id=organization_id, po_id=id)
    if not po:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase order not found in this organization",
        )
    return po


@router.post("/{id}/issue", response_model=PurchaseOrderRead)
async def issue_purchase_order(
    id: UUID,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Issue purchase order to vendor (moves from DRAFT to ISSUED)."""
    return await purchase_order_service.issue_po(db, organization_id=organization_id, po_id=id)


@router.post("/{id}/receive", response_model=PurchaseOrderRead)
async def receive_purchase_order(
    id: UUID,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Acknowledge inbound delivery: credit warehouse stock via append-only ledger IN movements."""
    return await purchase_order_service.receive_po(db, organization_id=organization_id, po_id=id)


@router.post("/{id}/cancel", response_model=PurchaseOrderRead)
async def cancel_purchase_order(
    id: UUID,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Cancel purchase order prior to receiving goods."""
    return await purchase_order_service.cancel_po(db, organization_id=organization_id, po_id=id)
