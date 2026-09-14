"""User Repository Layer."""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.repositories.base import BaseRepository
from app.schemas.organization import UserCreate
from app.core.security import get_password_hash


class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    async def get_by_id(self, db: AsyncSession, id: UUID) -> Optional[User]:
        return await self.get(db, id)

    async def list_by_organization(self, db: AsyncSession, organization_id: UUID) -> List[User]:
        stmt = select(User).where(User.organization_id == organization_id).order_by(User.name.asc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def create_user(
        self, db: AsyncSession, *, obj_in: UserCreate, organization_id: UUID, password: Optional[str] = "admin123"
    ) -> User:
        db_obj = User(
            name=obj_in.name,
            email=obj_in.email,
            role=obj_in.role,
            password_hash=get_password_hash(password) if password else None,
            organization_id=organization_id,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj


user_repo = UserRepository()
