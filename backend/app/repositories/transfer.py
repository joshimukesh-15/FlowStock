"""Stock Transfer Repository Layer."""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from app.models.transfer import StockTransfer
from app.repositories.base import TenantRepository


class TransferRepository(TenantRepository[StockTransfer]):
    def __init__(self):
        super().__init__(StockTransfer)

    async def get_by_tenant(
        self, db: AsyncSession, *, id: UUID, organization_id: UUID
    ) -> Optional[StockTransfer]:
        stmt = (
            select(StockTransfer)
            .options(
                joinedload(StockTransfer.source_warehouse),
                joinedload(StockTransfer.destination_warehouse),
                joinedload(StockTransfer.product),
            )
            .where(
                StockTransfer.id == id,
                StockTransfer.organization_id == organization_id,
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_transfers(
        self, db: AsyncSession, *, organization_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[StockTransfer]:
        stmt = (
            select(StockTransfer)
            .options(
                joinedload(StockTransfer.source_warehouse),
                joinedload(StockTransfer.destination_warehouse),
                joinedload(StockTransfer.product),
            )
            .where(StockTransfer.organization_id == organization_id)
            .order_by(StockTransfer.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())


transfer_repo = TransferRepository()
