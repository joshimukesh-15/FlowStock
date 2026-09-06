"""Audit Log API Endpoints."""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_tenant_id, require_admin
from app.models.user import User
from app.core.database import get_db
from app.schemas.audit import AuditLogRead
from app.services.audit import audit_service

router = APIRouter()


@router.get("", response_model=List[AuditLogRead])
async def list_audit_logs(
    entity_type: Optional[str] = Query(None, description="Filter by entity (Order, Invoice, Payment, Shipment, Inventory, PurchaseOrder)"),
    action: Optional[str] = Query(None, description="Filter by action (e.g. ORDER_CONFIRMED, PAYMENT_RECORDED)"),
    search: Optional[str] = Query(None, description="Search across entity name, user, action or details"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve immutable, tenant-isolated audit logs (Admin only)."""
    return await audit_service.list_audits(
        db,
        organization_id=organization_id,
        entity_type=entity_type,
        action=action,
        search=search,
        limit=limit,
        offset=offset,
    )
