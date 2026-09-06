"""Audit Log Database Repository."""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogCreate


class AuditRepository:
    """Repository handling append-only audit trail records."""

    async def create_audit(
        self,
        db: AsyncSession,
        organization_id: UUID,
        obj_in: AuditLogCreate,
    ) -> AuditLog:
        audit = AuditLog(
            organization_id=organization_id,
            user_id=obj_in.user_id,
            user_name=obj_in.user_name,
            action=obj_in.action,
            entity_type=obj_in.entity_type,
            entity_id=obj_in.entity_id,
            entity_name=obj_in.entity_name,
            details=obj_in.details,
            ip_address=obj_in.ip_address or "127.0.0.1",
        )
        db.add(audit)
        await db.commit()
        await db.refresh(audit)
        return audit

    async def list_audits(
        self,
        db: AsyncSession,
        organization_id: UUID,
        entity_type: Optional[str] = None,
        action: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[AuditLog]:
        stmt = (
            select(AuditLog)
            .where(AuditLog.organization_id == organization_id)
            .order_by(desc(AuditLog.created_at))
        )
        if entity_type:
            stmt = stmt.where(AuditLog.entity_type == entity_type)
        if action:
            stmt = stmt.where(AuditLog.action == action)
        if search:
            pattern = f"%{search}%"
            stmt = stmt.where(
                (AuditLog.entity_name.ilike(pattern))
                | (AuditLog.user_name.ilike(pattern))
                | (AuditLog.action.ilike(pattern))
                | (AuditLog.details.ilike(pattern))
            )
        stmt = stmt.limit(limit).offset(offset)
        res = await db.execute(stmt)
        return list(res.scalars().all())


audit_repo = AuditRepository()
