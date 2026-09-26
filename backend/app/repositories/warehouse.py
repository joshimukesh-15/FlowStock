from typing import List, Optional, Dict
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.warehouse import Warehouse
from app.models.inventory import InventoryMovement
from app.repositories.base import TenantRepository
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate


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

    async def get_warehouse_stock_map(
        self, db: AsyncSession, *, organization_id: UUID
    ) -> Dict[UUID, int]:
        stmt = (
            select(
                InventoryMovement.warehouse_id,
                func.coalesce(func.sum(InventoryMovement.quantity_change), 0),
            )
            .where(
                InventoryMovement.organization_id == organization_id,
                InventoryMovement.warehouse_id.isnot(None),
            )
            .group_by(InventoryMovement.warehouse_id)
        )
        result = await db.execute(stmt)
        return {row[0]: max(0, int(row[1])) for row in result.all()}

    async def create_warehouse(
        self, db: AsyncSession, *, obj_in: WarehouseCreate, organization_id: UUID
    ) -> Warehouse:
        if obj_in.is_default:
            stmt = select(Warehouse).where(
                Warehouse.organization_id == organization_id,
                Warehouse.is_default == True,
            )
            res = await db.execute(stmt)
            for other_wh in res.scalars().all():
                other_wh.is_default = False

        warehouse = Warehouse(
            organization_id=organization_id,
            name=obj_in.name,
            code=obj_in.code.strip().upper(),
            location=obj_in.location,
            capacity=obj_in.capacity if obj_in.capacity and obj_in.capacity > 0 else 2500,
            is_default=obj_in.is_default,
        )
        db.add(warehouse)
        await db.commit()
        await db.refresh(warehouse)
        return warehouse

    async def update_warehouse(
        self, db: AsyncSession, *, warehouse: Warehouse, obj_in: WarehouseUpdate
    ) -> Warehouse:
        update_data = obj_in.model_dump(exclude_unset=True)
        if "code" in update_data and update_data["code"]:
            update_data["code"] = update_data["code"].strip().upper()
        if update_data.get("is_default") is True:
            stmt = select(Warehouse).where(
                Warehouse.organization_id == warehouse.organization_id,
                Warehouse.is_default == True,
                Warehouse.id != warehouse.id,
            )
            res = await db.execute(stmt)
            for other_wh in res.scalars().all():
                other_wh.is_default = False
        for field, value in update_data.items():
            setattr(warehouse, field, value)
        await db.commit()
        await db.refresh(warehouse)
        return warehouse


warehouse_repo = WarehouseRepository()
