"""Shipment and Shipment Tracking Database Models."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4
from sqlalchemy import String, Float, ForeignKey, DateTime, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, TenantScopedModel
from app.models.order import SalesOrder


class Shipment(TenantScopedModel):
    """Logistics shipment record linked to a sales order."""
    __tablename__ = "shipments"

    order_id: Mapped[UUID] = mapped_column(
        ForeignKey("sales_orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    shipment_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    carrier: Mapped[str] = mapped_column(String(100), nullable=False)
    tracking_number: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(30), default="PENDING", nullable=False, index=True
    )  # PENDING, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
    shipping_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    origin_address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    destination_address: Mapped[str] = mapped_column(String(255), nullable=False)
    estimated_delivery: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_delivery: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    order: Mapped["SalesOrder"] = relationship("SalesOrder", lazy="joined")
    events: Mapped[List["ShipmentEvent"]] = relationship(
        "ShipmentEvent",
        back_populates="shipment",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="ShipmentEvent.created_at",
    )

    __table_args__ = (
        UniqueConstraint("organization_id", "shipment_number", name="uq_org_shipment_number"),
        Index("ix_shipments_org_status", "organization_id", "status"),
        Index("ix_shipments_org_order", "organization_id", "order_id"),
        Index("ix_shipments_org_created", "organization_id", "created_at"),
    )


class ShipmentEvent(Base, TimestampMixin):
    """Chronological milestone or checkpoint scan along the shipment journey."""
    __tablename__ = "shipment_events"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    shipment_id: Mapped[UUID] = mapped_column(
        ForeignKey("shipments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    location: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)

    shipment: Mapped["Shipment"] = relationship("Shipment", back_populates="events")
