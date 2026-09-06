"""Category and Product Repository Layer."""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, or_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload
from app.models.catalog import Category, Product
from app.repositories.base import TenantRepository
from app.schemas.catalog import CategoryCreate, ProductCreate, ProductUpdate


class CategoryRepository(TenantRepository[Category]):
    def __init__(self):
        super().__init__(Category)

    async def get_by_name(
        self, db: AsyncSession, *, organization_id: UUID, name: str
    ) -> Optional[Category]:
        stmt = select(Category).where(
            Category.organization_id == organization_id,
            Category.name.ilike(name.strip()),
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_tenant(
        self, db: AsyncSession, *, organization_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Category]:
        stmt = (
            select(Category)
            .where(Category.organization_id == organization_id)
            .order_by(Category.name.asc())
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())


class ProductRepository(TenantRepository[Product]):
    def __init__(self):
        super().__init__(Product)

    async def get_by_sku(
        self, db: AsyncSession, *, organization_id: UUID, sku: str
    ) -> Optional[Product]:
        stmt = (
            select(Product)
            .options(joinedload(Product.category))
            .where(
                Product.organization_id == organization_id,
                Product.sku == sku.strip(),
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_tenant(
        self, db: AsyncSession, *, id: UUID, organization_id: UUID
    ) -> Optional[Product]:
        stmt = (
            select(Product)
            .options(joinedload(Product.category))
            .where(
                Product.id == id,
                Product.organization_id == organization_id,
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_products(
        self,
        db: AsyncSession,
        *,
        organization_id: UUID,
        search: Optional[str] = None,
        category_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Product]:
        stmt = (
            select(Product)
            .options(joinedload(Product.category))
            .where(Product.organization_id == organization_id)
        )

        if category_id:
            stmt = stmt.where(Product.category_id == category_id)

        if search and search.strip():
            term = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Product.name.ilike(term),
                    Product.sku.ilike(term),
                )
            )

        stmt = stmt.order_by(Product.name.asc()).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def create_product(
        self, db: AsyncSession, *, obj_in: ProductCreate, organization_id: UUID
    ) -> Product:
        obj_data = obj_in.model_dump()
        obj_data["organization_id"] = organization_id
        db_obj = Product(**obj_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        # Reload with joined category
        return await self.get_by_tenant(db, id=db_obj.id, organization_id=organization_id)

    async def update_product(
        self, db: AsyncSession, *, db_obj: Product, obj_in: ProductUpdate
    ) -> Product:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return await self.get_by_tenant(db, id=db_obj.id, organization_id=db_obj.organization_id)


category_repo = CategoryRepository()
product_repo = ProductRepository()
