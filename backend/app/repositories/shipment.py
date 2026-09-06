"""Shipment and Tracking Repository Layer."""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.shipment import Shipment, ShipmentEvent
from app.models.order import SalesOrder, OrderItem
from app.repositories.base import TenantRepository


class ShipmentRepository(TenantRepository[Shipment]):
    def __init__(self):
        super().__init__(Shipment)

    async def get_shipment_detail(
        self, db: AsyncSession, *, organization_id: UUID, shipment_id: UUID
    ) -> Optional[Shipment]:
        stmt = (
            select(Shipment)
            .where(
                Shipment.organization_id == organization_id,
                Shipment.id == shipment_id,
            )
            .options(
                joinedload(Shipment.order).joinedload(SalesOrder.customer),
                joinedload(Shipment.order).joinedload(SalesOrder.warehouse),
                joinedload(Shipment.order)
                .selectinload(SalesOrder.items)
                .joinedload(OrderItem.product),
                selectinload(Shipment.events),
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_shipments(
        self,
        db: AsyncSession,
        *,
        organization_id: UUID,
        status: Optional[str] = None,
        order_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Shipment]:
        stmt = (
            select(Shipment)
            .where(Shipment.organization_id == organization_id)
            .options(
                joinedload(Shipment.order).joinedload(SalesOrder.customer),
                joinedload(Shipment.order).joinedload(SalesOrder.warehouse),
                selectinload(Shipment.events),
            )
        )
        if status and status.upper() != "ALL":
            stmt = stmt.where(Shipment.status == status.upper())
        if order_id:
            stmt = stmt.where(Shipment.order_id == order_id)

        stmt = stmt.order_by(Shipment.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_shipment_number(
        self, db: AsyncSession, *, organization_id: UUID, shipment_number: str
    ) -> Optional[Shipment]:
        stmt = select(Shipment).where(
            Shipment.organization_id == organization_id,
            Shipment.shipment_number == shipment_number,
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_tracking(
        self, db: AsyncSession, *, organization_id: UUID, tracking_number: str
    ) -> Optional[Shipment]:
        stmt = select(Shipment).where(
            Shipment.organization_id == organization_id,
            Shipment.tracking_number == tracking_number,
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def add_event(
        self,
        db: AsyncSession,
        *,
        shipment_id: UUID,
        status: str,
        location: str,
        description: str,
    ) -> ShipmentEvent:
        event = ShipmentEvent(
            shipment_id=shipment_id,
            status=status,
            location=location,
            description=description,
        )
        db.add(event)
        await db.commit()
        await db.refresh(event)
        return event


shipment_repo = ShipmentRepository()
