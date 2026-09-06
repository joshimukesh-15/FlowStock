"""Sales Order Endpoints."""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import (
    get_current_tenant_id,
    get_current_user,
    require_sales_or_admin,
    require_warehouse_or_admin,
)
from app.models.user import User
from app.core.database import get_db
from app.schemas.order import SalesOrderCreate, SalesOrderRead
from app.repositories.order import order_repo
from app.services.order import order_service

router = APIRouter()


@router.get("", response_model=List[SalesOrderRead])
async def list_orders(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: DRAFT, CONFIRMED, FULFILLED, CANCELLED"),
    customer_id: Optional[UUID] = Query(None, description="Filter by customer ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """List all sales orders for the active tenant."""
    return await order_repo.list_orders(
        db,
        organization_id=organization_id,
        status=status_filter,
        customer_id=customer_id,
        skip=skip,
        limit=limit,
    )


@router.post("", response_model=SalesOrderRead, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: SalesOrderCreate,
    current_user: User = Depends(require_sales_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Create a new sales order in DRAFT status."""
    return await order_service.create_order(
        db, organization_id=organization_id, obj_in=order_in
    )


@router.get("/{id}", response_model=SalesOrderRead)
async def get_order(
    id: UUID,
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Get full sales order details with line items."""
    order = await order_repo.get_order_detail(db, organization_id=organization_id, order_id=id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales order not found in this organization",
        )
    return order


@router.post("/{id}/confirm", response_model=SalesOrderRead)
async def confirm_order(
    id: UUID,
    current_user: User = Depends(require_sales_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Confirm order and reserve inventory (Stock Allocation)."""
    return await order_service.confirm_order(db, organization_id=organization_id, order_id=id)


@router.post("/{id}/fulfill", response_model=SalesOrderRead)
async def fulfill_order(
    id: UUID,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Fulfill order: deduct physical stock via append-only ledger movements."""
    return await order_service.fulfill_order(db, organization_id=organization_id, order_id=id)


@router.post("/{id}/cancel", response_model=SalesOrderRead)
async def cancel_order(
    id: UUID,
    current_user: User = Depends(require_sales_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Cancel order and release reserved stock."""
    return await order_service.cancel_order(db, organization_id=organization_id, order_id=id)
