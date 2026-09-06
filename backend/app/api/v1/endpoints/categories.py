from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import (
    get_current_tenant_id,
    get_current_user,
    require_warehouse_or_admin,
)
from app.models.user import User
from app.core.database import get_db
from app.schemas.catalog import CategoryCreate, CategoryRead
from app.services.catalog import catalog_service

router = APIRouter()


@router.get("", response_model=List[CategoryRead])
async def list_categories(
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """List all categories for the active tenant."""
    return await catalog_service.list_categories(db, organization_id)


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_in: CategoryCreate,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Create a new category for the active tenant."""
    return await catalog_service.create_category(db, organization_id, category_in)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    id: UUID,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Delete a category for the active tenant."""
    await catalog_service.delete_category(db, organization_id, id)
