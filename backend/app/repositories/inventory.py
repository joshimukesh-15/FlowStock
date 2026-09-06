"""Inventory Ledger Repository Layer with Warehouse Support."""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.inventory import InventoryMovement
from app.repositories.base import TenantRepository


class InventoryRepository(TenantRepository[InventoryMovement]):
    def __init__(self):
        super().__init__(InventoryMovement)

    async def get_stock_level(
        self,
        db: AsyncSession,
        *,
        organization_id: UUID,
        product_id: UUID,
        warehouse_id: Optional[UUID] = None,
    ) -> int:
        """Calculate stock level dynamically (optionally filtered by warehouse)."""
        stmt = select(
            func.coalesce(func.sum(InventoryMovement.quantity_change), 0)
        ).where(
            InventoryMovement.organization_id == organization_id,
            InventoryMovement.product_id == product_id,
        )
        if warehouse_id:
            stmt = stmt.where(InventoryMovement.warehouse_id == warehouse_id)

        result = await db.execute(stmt)
        return int(result.scalar_one())

    async def get_all_stock_levels(
        self,
        db: AsyncSession,
        *,
        organization_id: UUID,
        warehouse_id: Optional[UUID] = None,
    ) -> dict[UUID, int]:
        """Calculate total stock levels for all products in an organization in a single aggregated query."""
        stmt = (
            select(
                InventoryMovement.product_id,
                func.coalesce(func.sum(InventoryMovement.quantity_change), 0),
            )
            .where(InventoryMovement.organization_id == organization_id)
            .group_by(InventoryMovement.product_id)
        )
        if warehouse_id:
            stmt = stmt.where(InventoryMovement.warehouse_id == warehouse_id)

        result = await db.execute(stmt)
        return {row[0]: int(row[1]) for row in result.all()}

    async def list_movements_for_product(
        self,
        db: AsyncSession,
        *,
        organization_id: UUID,
        product_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> List[InventoryMovement]:
        stmt = (
            select(InventoryMovement)
            .where(
                InventoryMovement.organization_id == organization_id,
                InventoryMovement.product_id == product_id,
            )
            .order_by(InventoryMovement.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def record_movement(
        self,
        db: AsyncSession,
        *,
        organization_id: UUID,
        product_id: UUID,
        movement_type: str,
        quantity_change: int,
        reference: str,
        warehouse_id: Optional[UUID] = None,
        notes: Optional[str] = None,
    ) -> InventoryMovement:
        movement = InventoryMovement(
            organization_id=organization_id,
            product_id=product_id,
            warehouse_id=warehouse_id,
            movement_type=movement_type,
            quantity_change=quantity_change,
            reference=reference,
            notes=notes,
        )
        db.add(movement)
        await db.commit()
        await db.refresh(movement)
        return movement


inventory_repo = InventoryRepository()
