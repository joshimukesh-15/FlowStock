"""Notification Business Logic Service."""
from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification
from app.repositories.notification import notification_repo
from app.schemas.notification import NotificationCreate


class NotificationService:
    """Service managing in-app notifications and unread badges."""

    async def create_notification(
        self,
        db: AsyncSession,
        organization_id: UUID,
        title: str,
        message: str,
        type: str = "INFO",
        link: Optional[str] = None,
        user_id: Optional[UUID] = None,
    ) -> Notification:
        obj_in = NotificationCreate(
            title=title,
            message=message,
            type=type,
            link=link,
            user_id=user_id,
        )
        notification = await notification_repo.create_notification(
            db, organization_id=organization_id, obj_in=obj_in
        )
        try:
            from app.core.websocket_manager import ws_manager
            await ws_manager.broadcast_to_tenant(
                organization_id,
                {
                    "event": "NOTIFICATION_CREATED",
                    "data": {
                        "id": str(notification.id),
                        "title": notification.title,
                        "message": notification.message,
                        "type": notification.type,
                        "link": notification.link,
                        "created_at": notification.created_at.isoformat() if notification.created_at else None,
                    },
                },
            )
        except Exception:
            pass
        return notification

    async def list_notifications(
        self,
        db: AsyncSession,
        organization_id: UUID,
        user_id: Optional[UUID] = None,
        unread_only: bool = False,
        limit: int = 50,
    ) -> List[Notification]:
        return await notification_repo.list_notifications(
            db,
            organization_id=organization_id,
            user_id=user_id,
            unread_only=unread_only,
            limit=limit,
        )

    async def get_unread_count(
        self,
        db: AsyncSession,
        organization_id: UUID,
        user_id: Optional[UUID] = None,
    ) -> int:
        return await notification_repo.get_unread_count(
            db, organization_id=organization_id, user_id=user_id
        )

    async def mark_as_read(
        self,
        db: AsyncSession,
        organization_id: UUID,
        notification_id: UUID,
    ) -> Notification:
        notif = await notification_repo.mark_as_read(
            db, organization_id=organization_id, notification_id=notification_id
        )
        if not notif:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found or access denied.",
            )
        return notif

    async def mark_all_read(
        self,
        db: AsyncSession,
        organization_id: UUID,
        user_id: Optional[UUID] = None,
    ) -> int:
        return await notification_repo.mark_all_read(
            db, organization_id=organization_id, user_id=user_id
        )


notification_service = NotificationService()
