"""Shipments & Logistics Endpoints."""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import (
    get_current_tenant_id,
    get_current_user,
    require_warehouse_or_admin,
)
from app.models.user import User
from app.core.database import get_db
from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentRead,
    ShipmentStatusUpdate,
    ShipmentEventCreate,
    ShipmentEventRead,
)
from app.services.shipment import shipment_service

router = APIRouter()


@router.get("", response_model=List[ShipmentRead])
async def list_shipments(
    status: Optional[str] = Query(None, description="Filter by status (PENDING, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, CANCELLED)"),
    order_id: Optional[UUID] = Query(None, description="Filter by sales order ID"),
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """List tenant shipments with carrier, status, and milestone events."""
    return await shipment_service.list_shipments(
        db, organization_id=organization_id, status_filter=status, order_id=order_id
    )


@router.post("", response_model=ShipmentRead, status_code=status.HTTP_201_CREATED)
async def create_shipment(
    shipment_in: ShipmentCreate,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Create a new outbound logistics shipment for a confirmed or fulfilled sales order."""
    return await shipment_service.create_shipment(
        db, organization_id=organization_id, obj_in=shipment_in
    )


@router.get("/{shipment_id}", response_model=ShipmentRead)
async def get_shipment(
    shipment_id: UUID,
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed shipment manifest with customer, order line items, and full tracking timeline."""
    return await shipment_service.get_shipment(
        db, organization_id=organization_id, shipment_id=shipment_id
    )


@router.post("/{shipment_id}/dispatch", response_model=ShipmentRead)
async def dispatch_shipment(
    shipment_id: UUID,
    update_in: Optional[ShipmentStatusUpdate] = None,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Dispatch shipment into transit with courier carrier."""
    return await shipment_service.dispatch_shipment(
        db, organization_id=organization_id, shipment_id=shipment_id, update_in=update_in
    )


@router.post("/{shipment_id}/out-for-delivery", response_model=ShipmentRead)
async def mark_out_for_delivery(
    shipment_id: UUID,
    update_in: Optional[ShipmentStatusUpdate] = None,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Mark shipment as out for final delivery with local courier agent."""
    return await shipment_service.mark_out_for_delivery(
        db, organization_id=organization_id, shipment_id=shipment_id, update_in=update_in
    )


@router.post("/{shipment_id}/deliver", response_model=ShipmentRead)
async def deliver_shipment(
    shipment_id: UUID,
    update_in: Optional[ShipmentStatusUpdate] = None,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Mark shipment as successfully delivered to consignee recipient."""
    return await shipment_service.deliver_shipment(
        db, organization_id=organization_id, shipment_id=shipment_id, update_in=update_in
    )


@router.post("/{shipment_id}/cancel", response_model=ShipmentRead)
async def cancel_shipment(
    shipment_id: UUID,
    update_in: Optional[ShipmentStatusUpdate] = None,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Cancel shipment delivery."""
    return await shipment_service.cancel_shipment(
        db, organization_id=organization_id, shipment_id=shipment_id, update_in=update_in
    )


@router.post("/{shipment_id}/events", response_model=ShipmentEventRead, status_code=status.HTTP_201_CREATED)
async def add_checkpoint_event(
    shipment_id: UUID,
    event_in: ShipmentEventCreate,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Log an intermediate transit checkpoint scan in the tracking timeline."""
    return await shipment_service.add_checkpoint_event(
        db, organization_id=organization_id, shipment_id=shipment_id, event_in=event_in
    )
