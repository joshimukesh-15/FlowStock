"""Sales Order Repository Layer."""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.order import SalesOrder, OrderItem
from app.repositories.base import TenantRepository


class OrderRepository(TenantRepository[SalesOrder]):
    def __init__(self):
        super().__init__(SalesOrder)

    async def get_by_order_number(
        self, db: AsyncSession, *, organization_id: UUID, order_number: str
    ) -> Optional[SalesOrder]:
        stmt = (
            select(SalesOrder)
            .where(
                SalesOrder.organization_id == organization_id,
                SalesOrder.order_number == order_number.strip().upper(),
            )
            .options(
                joinedload(SalesOrder.customer),
                joinedload(SalesOrder.warehouse),
                selectinload(SalesOrder.items).joinedload(OrderItem.product),
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_order_detail(
        self, db: AsyncSession, *, organization_id: UUID, order_id: UUID
    ) -> Optional[SalesOrder]:
        stmt = (
            select(SalesOrder)
            .where(
                SalesOrder.organization_id == organization_id,
                SalesOrder.id == order_id,
            )
            .options(
                joinedload(SalesOrder.customer),
                joinedload(SalesOrder.warehouse),
                selectinload(SalesOrder.items).joinedload(OrderItem.product),
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_orders(
        self,
        db: AsyncSession,
        *,
        organization_id: UUID,
        status: Optional[str] = None,
        customer_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[SalesOrder]:
        stmt = (
            select(SalesOrder)
            .where(SalesOrder.organization_id == organization_id)
            .options(
                joinedload(SalesOrder.customer),
                joinedload(SalesOrder.warehouse),
                selectinload(SalesOrder.items).joinedload(OrderItem.product),
            )
        )
        if status and status.upper() != "ALL":
            stmt = stmt.where(SalesOrder.status == status.upper())
        if customer_id:
            stmt = stmt.where(SalesOrder.customer_id == customer_id)

        stmt = stmt.order_by(SalesOrder.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_allocated_quantity(
        self, db: AsyncSession, *, organization_id: UUID, product_id: UUID
    ) -> int:
        """Calculate total reserved/allocated quantity across all CONFIRMED orders."""
        stmt = (
            select(func.coalesce(func.sum(OrderItem.quantity), 0))
            .join(SalesOrder, OrderItem.order_id == SalesOrder.id)
            .where(
                SalesOrder.organization_id == organization_id,
                SalesOrder.status == "CONFIRMED",
                OrderItem.product_id == product_id,
            )
        )
        result = await db.execute(stmt)
        return int(result.scalar() or 0)

    async def count_orders_by_tenant(
        self, db: AsyncSession, *, organization_id: UUID
    ) -> int:
        stmt = select(func.count(SalesOrder.id)).where(SalesOrder.organization_id == organization_id)
        result = await db.execute(stmt)
        return int(result.scalar() or 0)


order_repo = OrderRepository()
