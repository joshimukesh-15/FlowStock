"""Supplier Endpoints."""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import (
    get_current_tenant_id,
    get_current_user,
    require_warehouse_or_admin,
)
from app.models.user import User
from app.core.database import get_db
from app.schemas.supplier import SupplierCreate, SupplierRead, SupplierUpdate
from app.repositories.supplier import supplier_repo

router = APIRouter()


@router.get("", response_model=List[SupplierRead])
async def list_suppliers(
    search: Optional[str] = Query(None, description="Search by name, email, or company"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """List all suppliers belonging to the active organization."""
    return await supplier_repo.list_suppliers(
        db, organization_id=organization_id, search=search, skip=skip, limit=limit
    )


@router.post("", response_model=SupplierRead, status_code=status.HTTP_201_CREATED)
async def create_supplier(
    supplier_in: SupplierCreate,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Register a new vendor/supplier profile for the active organization."""
    existing = await supplier_repo.get_by_email(
        db, organization_id=organization_id, email=supplier_in.email
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Supplier with email '{supplier_in.email}' already exists in this organization",
        )
    return await supplier_repo.create_supplier(
        db, obj_in=supplier_in, organization_id=organization_id
    )


@router.get("/{id}", response_model=SupplierRead)
async def get_supplier(
    id: UUID,
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Get supplier profile details by ID."""
    supplier = await supplier_repo.get(db, id=id, organization_id=organization_id)
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found in this organization",
        )
    return supplier


@router.put("/{id}", response_model=SupplierRead)
async def update_supplier(
    id: UUID,
    supplier_in: SupplierUpdate,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Update supplier profile."""
    supplier = await supplier_repo.get(db, id=id, organization_id=organization_id)
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found in this organization",
        )
    return await supplier_repo.update_supplier(db, supplier=supplier, obj_in=supplier_in)
