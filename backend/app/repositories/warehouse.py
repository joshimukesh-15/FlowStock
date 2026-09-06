"""Warehouse Repository Layer."""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.warehouse import Warehouse
from app.repositories.base import TenantRepository
from app.schemas.warehouse import WarehouseCreate


class WarehouseRepository(TenantRepository[Warehouse]):
    def __init__(self):
        super().__init__(Warehouse)

    async def get_by_code(
        self, db: AsyncSession, *, organization_id: UUID, code: str
    ) -> Optional[Warehouse]:
        stmt = select(Warehouse).where(
            Warehouse.organization_id == organization_id,
            Warehouse.code == code.strip().upper(),
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_default(
        self, db: AsyncSession, *, organization_id: UUID
    ) -> Optional[Warehouse]:
        stmt = select(Warehouse).where(
            Warehouse.organization_id == organization_id,
            Warehouse.is_default == True,
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_tenant(
        self, db: AsyncSession, *, organization_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Warehouse]:
        stmt = (
            select(Warehouse)
            .where(Warehouse.organization_id == organization_id)
            .order_by(Warehouse.is_default.desc(), Warehouse.name.asc())
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def create_warehouse(
        self, db: AsyncSession, *, obj_in: WarehouseCreate, organization_id: UUID
    ) -> Warehouse:
        warehouse = Warehouse(
            organization_id=organization_id,
            name=obj_in.name,
            code=obj_in.code.strip().upper(),
            location=obj_in.location,
            is_default=obj_in.is_default,
        )
        db.add(warehouse)
        await db.commit()
        await db.refresh(warehouse)
        return warehouse


warehouse_repo = WarehouseRepository()
