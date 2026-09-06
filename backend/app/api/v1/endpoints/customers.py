"""Customer Endpoints."""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_tenant_id, get_current_user, require_sales_or_admin
from app.models.user import User
from app.core.database import get_db
from app.schemas.customer import CustomerCreate, CustomerRead, CustomerUpdate
from app.repositories.customer import customer_repo

router = APIRouter()


@router.get("", response_model=List[CustomerRead])
async def list_customers(
    search: Optional[str] = Query(None, description="Search by name, email, or company"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """List all customers belonging to the active organization."""
    return await customer_repo.list_customers(
        db, organization_id=organization_id, search=search, skip=skip, limit=limit
    )


@router.post("", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer_in: CustomerCreate,
    current_user: User = Depends(require_sales_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Create a new customer profile for the active organization."""
    existing = await customer_repo.get_by_email(
        db, organization_id=organization_id, email=customer_in.email
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with email '{customer_in.email}' already exists in this organization",
        )
    return await customer_repo.create_customer(
        db, obj_in=customer_in, organization_id=organization_id
    )


@router.get("/{id}", response_model=CustomerRead)
async def get_customer(
    id: UUID,
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Get customer details by ID."""
    customer = await customer_repo.get(db, id=id, organization_id=organization_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found in this organization",
        )
    return customer


@router.put("/{id}", response_model=CustomerRead)
async def update_customer(
    id: UUID,
    customer_in: CustomerUpdate,
    current_user: User = Depends(require_sales_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Update customer profile."""
    customer = await customer_repo.get(db, id=id, organization_id=organization_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found in this organization",
        )
    return await customer_repo.update_customer(db, customer=customer, obj_in=customer_in)
