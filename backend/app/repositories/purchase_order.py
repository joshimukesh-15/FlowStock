"""Purchase Order Repository Layer."""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.repositories.base import TenantRepository


class PurchaseOrderRepository(TenantRepository[PurchaseOrder]):
    def __init__(self):
        super().__init__(PurchaseOrder)

    async def get_po_detail(
        self, db: AsyncSession, *, organization_id: UUID, po_id: UUID
    ) -> Optional[PurchaseOrder]:
        stmt = (
            select(PurchaseOrder)
            .where(
                PurchaseOrder.organization_id == organization_id,
                PurchaseOrder.id == po_id,
            )
            .options(
                joinedload(PurchaseOrder.supplier),
                joinedload(PurchaseOrder.destination_warehouse),
                selectinload(PurchaseOrder.items).joinedload(PurchaseOrderItem.product),
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_pos(
        self,
        db: AsyncSession,
        *,
        organization_id: UUID,
        status: Optional[str] = None,
        supplier_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[PurchaseOrder]:
        stmt = (
            select(PurchaseOrder)
            .where(PurchaseOrder.organization_id == organization_id)
            .options(
                joinedload(PurchaseOrder.supplier),
                joinedload(PurchaseOrder.destination_warehouse),
                selectinload(PurchaseOrder.items).joinedload(PurchaseOrderItem.product),
            )
        )
        if status and status.upper() != "ALL":
            stmt = stmt.where(PurchaseOrder.status == status.upper())
        if supplier_id:
            stmt = stmt.where(PurchaseOrder.supplier_id == supplier_id)

        stmt = stmt.order_by(PurchaseOrder.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def count_pos_by_tenant(
        self, db: AsyncSession, *, organization_id: UUID
    ) -> int:
        stmt = select(func.count(PurchaseOrder.id)).where(PurchaseOrder.organization_id == organization_id)
        result = await db.execute(stmt)
        return int(result.scalar() or 0)


purchase_order_repo = PurchaseOrderRepository()
