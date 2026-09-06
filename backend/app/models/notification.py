"""Notification Database Model."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from sqlalchemy import String, Boolean, ForeignKey, DateTime, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import TenantScopedModel
from app.models.user import User


class Notification(TenantScopedModel):
    """In-app user and operational alert notification."""
    __tablename__ = "notifications"

    user_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    type: Mapped[str] = mapped_column(
        String(30),
        default="INFO",
        nullable=False,
        index=True,
    )  # INFO, WARNING, SUCCESS, DANGER
    link: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    is_read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    read_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    user: Mapped[Optional["User"]] = relationship("User", lazy="joined")

    __table_args__ = (
        Index("ix_notifications_org_read_created", "organization_id", "is_read", "created_at"),
    )
