"""Organization and Tenant Management Service."""
from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.organization import Organization
from app.models.user import User
from app.repositories.organization import organization_repo
from app.repositories.user import user_repo
from app.schemas.organization import OrganizationCreate, UserCreate


class OrganizationService:
    async def list_organizations(self, db: AsyncSession) -> List[Organization]:
        return await organization_repo.list_all(db)

    async def get_organization(self, db: AsyncSession, id: UUID) -> Organization:
        org = await organization_repo.get_by_id(db, id)
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization with id '{id}' not found.",
            )
        return org

    async def create_organization(self, db: AsyncSession, obj_in: OrganizationCreate) -> Organization:
        existing = await organization_repo.get_by_slug(db, obj_in.slug)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An organization with slug '{obj_in.slug}' already exists.",
            )
        org = await organization_repo.create(db, obj_in=obj_in)
        # Create default Admin user for this tenant
        await user_repo.create_user(
            db,
            obj_in=UserCreate(
                name=f"{org.name} Admin",
                email=f"admin@{org.slug}.local",
                role="admin",
            ),
            organization_id=org.id,
        )
        await db.refresh(org)
        return org

    async def add_user_to_org(
        self, db: AsyncSession, organization_id: UUID, obj_in: UserCreate
    ) -> User:
        await self.get_organization(db, organization_id)
        return await user_repo.create_user(db, obj_in=obj_in, organization_id=organization_id)

    async def list_users(self, db: AsyncSession, organization_id: UUID) -> List[User]:
        return await user_repo.list_by_organization(db, organization_id)

    async def delete_organization(self, db: AsyncSession, id: UUID) -> None:
        orgs = await organization_repo.list_all(db)
        if len(orgs) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the last remaining organization.",
            )
        deleted = await organization_repo.delete_cascade(db, id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization with id '{id}' not found.",
            )


organization_service = OrganizationService()
