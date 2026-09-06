"""Product Management Endpoints."""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_tenant_id, get_current_user, require_warehouse_or_admin
from app.models.user import User
from app.core.database import get_db
from app.schemas.catalog import ProductCreate, ProductUpdate, ProductRead
from app.services.catalog import catalog_service

router = APIRouter()


@router.get("", response_model=List[ProductRead])
async def list_products(
    search: Optional[str] = Query(None, description="Search by name or SKU"),
    category_id: Optional[UUID] = Query(None, description="Filter by category ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """List products for the active tenant with search and filter."""
    return await catalog_service.list_products(
        db,
        organization_id=organization_id,
        search=search,
        category_id=category_id,
        skip=skip,
        limit=limit,
    )


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_in: ProductCreate,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Create a new product/SKU for the active tenant."""
    return await catalog_service.create_product(db, organization_id, product_in)


@router.get("/{id}", response_model=ProductRead)
async def get_product(
    id: UUID,
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Get product details by ID for the active tenant."""
    return await catalog_service.get_product(db, organization_id, id)


@router.put("/{id}", response_model=ProductRead)
async def update_product(
    id: UUID,
    product_in: ProductUpdate,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Update a product for the active tenant."""
    return await catalog_service.update_product(db, organization_id, id, product_in)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    id: UUID,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Delete a product for the active tenant."""
    await catalog_service.delete_product(db, organization_id, id)
