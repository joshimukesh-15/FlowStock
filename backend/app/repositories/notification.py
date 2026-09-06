"""Notification Database Repository."""
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, func, desc, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate


class NotificationRepository:
    """Repository handling persistent notification records and unread state."""

    async def create_notification(
        self,
        db: AsyncSession,
        organization_id: UUID,
        obj_in: NotificationCreate,
    ) -> Notification:
        notification = Notification(
            organization_id=organization_id,
            user_id=obj_in.user_id,
            title=obj_in.title,
            message=obj_in.message,
            type=obj_in.type,
            link=obj_in.link,
            is_read=False,
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)
        return notification

    async def list_notifications(
        self,
        db: AsyncSession,
        organization_id: UUID,
        user_id: Optional[UUID] = None,
        unread_only: bool = False,
        limit: int = 50,
    ) -> List[Notification]:
        stmt = (
            select(Notification)
            .where(Notification.organization_id == organization_id)
            .order_by(desc(Notification.created_at))
        )
        if unread_only:
            stmt = stmt.where(Notification.is_read == False)  # noqa: E712
        if user_id:
            stmt = stmt.where(
                (Notification.user_id == user_id) | (Notification.user_id.is_(None))
            )
        stmt = stmt.limit(limit)
        res = await db.execute(stmt)
        return list(res.scalars().all())

    async def get_unread_count(
        self,
        db: AsyncSession,
        organization_id: UUID,
        user_id: Optional[UUID] = None,
    ) -> int:
        stmt = (
            select(func.count(Notification.id))
            .where(
                Notification.organization_id == organization_id,
                Notification.is_read == False,  # noqa: E712
            )
        )
        if user_id:
            stmt = stmt.where(
                (Notification.user_id == user_id) | (Notification.user_id.is_(None))
            )
        res = await db.execute(stmt)
        return int(res.scalar() or 0)

    async def get_by_id_and_tenant(
        self,
        db: AsyncSession,
        organization_id: UUID,
        notification_id: UUID,
    ) -> Optional[Notification]:
        stmt = select(Notification).where(
            Notification.id == notification_id,
            Notification.organization_id == organization_id,
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    async def mark_as_read(
        self,
        db: AsyncSession,
        organization_id: UUID,
        notification_id: UUID,
    ) -> Optional[Notification]:
        notification = await self.get_by_id_and_tenant(
            db, organization_id=organization_id, notification_id=notification_id
        )
        if not notification:
            return None
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(notification)
        return notification

    async def mark_all_read(
        self,
        db: AsyncSession,
        organization_id: UUID,
        user_id: Optional[UUID] = None,
    ) -> int:
        now = datetime.now(timezone.utc)
        stmt = (
            update(Notification)
            .where(
                Notification.organization_id == organization_id,
                Notification.is_read == False,  # noqa: E712
            )
            .values(is_read=True, read_at=now)
        )
        if user_id:
            stmt = stmt.where(
                (Notification.user_id == user_id) | (Notification.user_id.is_(None))
            )
        res = await db.execute(stmt)
        await db.commit()
        return res.rowcount


notification_repo = NotificationRepository()
