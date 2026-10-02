"""Audit Log Database Model."""
from typing import Optional
from uuid import UUID
from sqlalchemy import String, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import TenantScopedModel
from app.models.user import User


class AuditLog(TenantScopedModel):
    """Immutable audit trail recording state changes and operational events."""
    __tablename__ = "audit_logs"

    user_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    user_name: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True,
    )
    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )  # e.g., ORDER_CONFIRMED, PAYMENT_RECORDED, STOCK_ADJUSTED
    entity_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )  # e.g., Order, Invoice, Payment, Shipment, Inventory, PurchaseOrder
    entity_id: Mapped[Optional[UUID]] = mapped_column(
        nullable=True,
        index=True,
    )
    entity_name: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True,
    )  # e.g., SO-3F2383, INV-SMS-01
    details: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        default="127.0.0.1",
    )

    user: Mapped[Optional["User"]] = relationship("User", lazy="joined")

    __table_args__ = (
        Index("ix_audit_org_created", "organization_id", "created_at"),
        Index("ix_audit_org_entity", "organization_id", "entity_type"),
        Index("ix_audit_org_action", "organization_id", "action"),
    )
