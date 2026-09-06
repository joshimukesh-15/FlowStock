"""Organization Repository Layer."""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.organization import Organization
from app.repositories.base import BaseRepository
from app.schemas.organization import OrganizationCreate


class OrganizationRepository(BaseRepository[Organization]):
    def __init__(self):
        super().__init__(Organization)

    async def get_by_id(self, db: AsyncSession, id: UUID) -> Optional[Organization]:
        stmt = select(Organization).where(Organization.id == id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_slug(self, db: AsyncSession, slug: str) -> Optional[Organization]:
        stmt = select(Organization).where(Organization.slug == slug)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> List[Organization]:
        stmt = select(Organization).order_by(Organization.name.asc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, db: AsyncSession, *, obj_in: OrganizationCreate) -> Organization:
        db_obj = Organization(
            name=obj_in.name,
            slug=obj_in.slug.lower().strip().replace(" ", "-"),
            currency=obj_in.currency.upper(),
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj


organization_repo = OrganizationRepository()
