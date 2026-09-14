"""Generic Layered Repository Pattern with Multi-Tenancy Enforcement."""
from typing import Any, Generic, List, Optional, Type, TypeVar, Union, Dict
from uuid import UUID
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import Base, TenantScopedModel

ModelType = TypeVar("ModelType", bound=Base)
TenantModelType = TypeVar("TenantModelType", bound=TenantScopedModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseRepository(Generic[ModelType]):
    """Generic repository providing core data access operations."""

    def __init__(self, model: Type[ModelType]):
        self.model = model

    async def get(self, db: AsyncSession, id: UUID) -> Optional[ModelType]:
        stmt = select(self.model).where(self.model.id == id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list(self, db: AsyncSession, *, skip: int = 0, limit: int = 100) -> List[ModelType]:
        stmt = select(self.model).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())


class TenantRepository(Generic[TenantModelType]):
    """Repository strictly enforcing organization-level data isolation."""

    def __init__(self, model: Type[TenantModelType]):
        self.model = model

    async def get_by_tenant(
        self, db: AsyncSession, *, id: UUID, organization_id: UUID
    ) -> Optional[TenantModelType]:
        """Fetch an entity strictly scoped to the tenant organization."""
        stmt = select(self.model).where(
            self.model.id == id,
            self.model.organization_id == organization_id,
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get(
        self, db: AsyncSession, *, id: UUID, organization_id: UUID
    ) -> Optional[TenantModelType]:
        """Convenience alias for get_by_tenant."""
        return await self.get_by_tenant(db, id=id, organization_id=organization_id)

    async def list_by_tenant(
        self, db: AsyncSession, *, organization_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[TenantModelType]:
        """List entities strictly scoped to the tenant organization."""
        stmt = (
            select(self.model)
            .where(self.model.organization_id == organization_id)
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def create(
        self, db: AsyncSession, *, obj_in: Union[BaseModel, Dict[str, Any]], organization_id: UUID
    ) -> TenantModelType:
        """Create an entity with mandatory organization_id binding."""
        obj_data = obj_in.model_dump() if isinstance(obj_in, BaseModel) else dict(obj_in)
        obj_data["organization_id"] = organization_id
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def delete_by_tenant(
        self, db: AsyncSession, *, id: UUID, organization_id: UUID
    ) -> bool:
        """Delete an entity scoped to tenant."""
        stmt = (
            delete(self.model)
            .where(
                self.model.id == id,
                self.model.organization_id == organization_id,
            )
        )
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount > 0
