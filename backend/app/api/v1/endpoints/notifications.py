"""Notification API Endpoints."""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_tenant_id
from app.core.database import get_db
from app.schemas.notification import NotificationRead, UnreadNotificationCount
from app.services.notification import notification_service

router = APIRouter()


@router.get("", response_model=List[NotificationRead])
async def list_notifications(
    unread_only: bool = Query(False, description="Filter only unread notifications"),
    limit: int = Query(50, ge=1, le=100),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve operational and event notifications for the active organization."""
    return await notification_service.list_notifications(
        db,
        organization_id=organization_id,
        unread_only=unread_only,
        limit=limit,
    )


@router.get("/unread-count", response_model=UnreadNotificationCount)
async def get_unread_count(
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Get fast count of unread notifications for active tenant."""
    count = await notification_service.get_unread_count(
        db, organization_id=organization_id
    )
    return UnreadNotificationCount(unread_count=count)


@router.patch("/{id}/read", response_model=NotificationRead)
async def mark_notification_read(
    id: UUID,
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Mark a specific notification as read."""
    return await notification_service.mark_as_read(
        db, organization_id=organization_id, notification_id=id
    )


@router.post("/mark-all-read", response_model=UnreadNotificationCount)
async def mark_all_notifications_read(
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Mark all unread notifications as read for the active organization."""
    await notification_service.mark_all_read(db, organization_id=organization_id)
    return UnreadNotificationCount(unread_count=0)
