"""Organization and Tenant Management Endpoints."""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.organization import OrganizationCreate, OrganizationRead, UserCreate, UserRead
from app.services.organization import organization_service

from app.api.deps import require_admin
from app.models.user import User
from fastapi import HTTPException

router = APIRouter()


@router.get("", response_model=List[OrganizationRead])
async def list_organizations(db: AsyncSession = Depends(get_db)):
    """List all available organizations for tenant switching."""
    return await organization_service.list_organizations(db)


@router.post("", response_model=OrganizationRead, status_code=status.HTTP_201_CREATED)
async def create_organization(
    org_in: OrganizationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new organization tenant."""
    return await organization_service.create_organization(db, org_in)


@router.get("/{id}", response_model=OrganizationRead)
async def get_organization(id: UUID, db: AsyncSession = Depends(get_db)):
    """Get organization by ID."""
    return await organization_service.get_organization(db, id)


@router.get("/{id}/users", response_model=List[UserRead])
async def list_organization_users(id: UUID, db: AsyncSession = Depends(get_db)):
    """List members belonging to an organization."""
    return await organization_service.list_users(db, id)


@router.post("/{id}/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def add_user_to_organization(
    id: UUID,
    user_in: UserCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Add a member to an organization (Admin only)."""
    if current_user.organization_id != id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot add users to a different organization tenant.",
        )
    return await organization_service.add_user_to_org(db, id, user_in)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(id: UUID, db: AsyncSession = Depends(get_db)):
    """Delete an organization tenant and cascade delete all associated data."""
    await organization_service.delete_organization(db, id)
    return None

