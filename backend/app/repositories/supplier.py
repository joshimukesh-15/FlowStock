"""Supplier Repository Layer."""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.supplier import Supplier
from app.repositories.base import TenantRepository
from app.schemas.supplier import SupplierCreate, SupplierUpdate


class SupplierRepository(TenantRepository[Supplier]):
    def __init__(self):
        super().__init__(Supplier)

    async def get_by_email(
        self, db: AsyncSession, *, organization_id: UUID, email: str
    ) -> Optional[Supplier]:
        stmt = select(Supplier).where(
            Supplier.organization_id == organization_id,
            Supplier.email == email.strip().lower(),
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_suppliers(
        self,
        db: AsyncSession,
        *,
        organization_id: UUID,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Supplier]:
        stmt = select(Supplier).where(Supplier.organization_id == organization_id)
        if search:
            s = f"%{search.strip().lower()}%"
            stmt = stmt.where(
                or_(
                    Supplier.name.ilike(s),
                    Supplier.email.ilike(s),
                    Supplier.company.ilike(s),
                )
            )
        stmt = stmt.order_by(Supplier.name.asc()).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def create_supplier(
        self, db: AsyncSession, *, obj_in: SupplierCreate, organization_id: UUID
    ) -> Supplier:
        supplier = Supplier(
            organization_id=organization_id,
            name=obj_in.name.strip(),
            email=obj_in.email.strip().lower(),
            phone=obj_in.phone.strip() if obj_in.phone else None,
            company=obj_in.company.strip() if obj_in.company else None,
            address=obj_in.address,
            payment_terms=obj_in.payment_terms or "Net 30",
        )
        db.add(supplier)
        await db.commit()
        await db.refresh(supplier)
        return supplier

    async def update_supplier(
        self, db: AsyncSession, *, supplier: Supplier, obj_in: SupplierUpdate
    ) -> Supplier:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "email" and value:
                setattr(supplier, field, value.strip().lower())
            elif isinstance(value, str):
                setattr(supplier, field, value.strip())
            else:
                setattr(supplier, field, value)
        await db.commit()
        await db.refresh(supplier)
        return supplier


supplier_repo = SupplierRepository()
