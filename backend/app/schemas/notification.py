"""Notification Pydantic Schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class NotificationBase(BaseModel):
    title: str
    message: str
    type: str = "INFO"  # INFO, WARNING, SUCCESS, DANGER
    link: Optional[str] = None


class NotificationCreate(NotificationBase):
    user_id: Optional[UUID] = None


class NotificationRead(NotificationBase):
    id: UUID
    organization_id: UUID
    user_id: Optional[UUID] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UnreadNotificationCount(BaseModel):
    unread_count: int
