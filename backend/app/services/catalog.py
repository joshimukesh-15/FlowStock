"""Catalog Business Logic Service."""
from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.catalog import Category, Product
from app.repositories.catalog import category_repo, product_repo
from app.schemas.catalog import CategoryCreate, ProductCreate, ProductUpdate


class CatalogService:
    # --- Category Operations ---
    async def list_categories(
        self, db: AsyncSession, organization_id: UUID
    ) -> List[Category]:
        return await category_repo.list_by_tenant(db, organization_id=organization_id)

    async def create_category(
        self, db: AsyncSession, organization_id: UUID, obj_in: CategoryCreate
    ) -> Category:
        existing = await category_repo.get_by_name(
            db, organization_id=organization_id, name=obj_in.name
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category '{obj_in.name}' already exists in this organization.",
            )
        return await category_repo.create(db, obj_in=obj_in, organization_id=organization_id)

    async def delete_category(
        self, db: AsyncSession, organization_id: UUID, category_id: UUID
    ) -> bool:
        category = await category_repo.get_by_tenant(
            db, id=category_id, organization_id=organization_id
        )
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found.",
            )
        return await category_repo.delete_by_tenant(
            db, id=category_id, organization_id=organization_id
        )

    # --- Product Operations ---
    async def list_products(
        self,
        db: AsyncSession,
        organization_id: UUID,
        search: Optional[str] = None,
        category_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Product]:
        return await product_repo.list_products(
            db,
            organization_id=organization_id,
            search=search,
            category_id=category_id,
            skip=skip,
            limit=limit,
        )

    async def get_product(
        self, db: AsyncSession, organization_id: UUID, product_id: UUID
    ) -> Product:
        product = await product_repo.get_by_tenant(
            db, id=product_id, organization_id=organization_id
        )
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id '{product_id}' not found.",
            )
        return product

    async def create_product(
        self, db: AsyncSession, organization_id: UUID, obj_in: ProductCreate
    ) -> Product:
        # Validate SKU uniqueness within the organization
        existing = await product_repo.get_by_sku(
            db, organization_id=organization_id, sku=obj_in.sku
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A product with SKU '{obj_in.sku}' already exists in this organization.",
            )

        # Validate category_id if provided
        if obj_in.category_id:
            category = await category_repo.get_by_tenant(
                db, id=obj_in.category_id, organization_id=organization_id
            )
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Specified category does not exist in this organization.",
                )

        return await product_repo.create_product(
            db, obj_in=obj_in, organization_id=organization_id
        )

    async def update_product(
        self,
        db: AsyncSession,
        organization_id: UUID,
        product_id: UUID,
        obj_in: ProductUpdate,
    ) -> Product:
        product = await self.get_product(db, organization_id, product_id)

        # If SKU is being updated, verify uniqueness
        if obj_in.sku and obj_in.sku != product.sku:
            existing = await product_repo.get_by_sku(
                db, organization_id=organization_id, sku=obj_in.sku
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"A product with SKU '{obj_in.sku}' already exists.",
                )

        # If category_id is being updated, verify existence
        if obj_in.category_id:
            category = await category_repo.get_by_tenant(
                db, id=obj_in.category_id, organization_id=organization_id
            )
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Specified category does not exist.",
                )

        return await product_repo.update_product(db, db_obj=product, obj_in=obj_in)

    async def delete_product(
        self, db: AsyncSession, organization_id: UUID, product_id: UUID
    ) -> bool:
        await self.get_product(db, organization_id, product_id)
        return await product_repo.delete_by_tenant(
            db, id=product_id, organization_id=organization_id
        )


catalog_service = CatalogService()
