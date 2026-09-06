"""Audit Log Business Logic Service."""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog
from app.repositories.audit import audit_repo
from app.schemas.audit import AuditLogCreate


class AuditService:
    """Service logging and querying audit logs for compliance and observability."""

    async def log_action(
        self,
        db: AsyncSession,
        organization_id: UUID,
        action: str,
        entity_type: str,
        entity_id: Optional[UUID] = None,
        entity_name: Optional[str] = None,
        details: Optional[str] = None,
        user_id: Optional[UUID] = None,
        user_name: Optional[str] = None,
        ip_address: Optional[str] = "127.0.0.1",
    ) -> AuditLog:
        obj_in = AuditLogCreate(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_name=entity_name,
            details=details,
            user_id=user_id,
            user_name=user_name or "System Operator",
            ip_address=ip_address or "127.0.0.1",
        )
        return await audit_repo.create_audit(
            db, organization_id=organization_id, obj_in=obj_in
        )

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
        return await audit_repo.list_audits(
            db,
            organization_id=organization_id,
            entity_type=entity_type,
            action=action,
            search=search,
            limit=limit,
            offset=offset,
        )


audit_service = AuditService()
