"""Inventory Movement Database Model (Append-Only Ledger with Warehouse Support)."""
from typing import Optional
from uuid import UUID
from sqlalchemy import String, Integer, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, TenantScopedModel


class InventoryMovement(TenantScopedModel):
    """Append-only inventory movement record."""
    __tablename__ = "inventory_movements"

    product_id: Mapped[UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    warehouse_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("warehouses.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    movement_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )  # "IN", "OUT", "ADJUSTMENT"
    quantity_change: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    reference: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Manual Entry",
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    product: Mapped["Product"] = relationship("Product", lazy="joined")
    warehouse: Mapped[Optional["Warehouse"]] = relationship("Warehouse", lazy="joined")

    __table_args__ = (
        Index("ix_movements_org_product", "organization_id", "product_id"),
        Index("ix_movements_org_warehouse", "organization_id", "warehouse_id"),
        Index("ix_movements_org_created", "organization_id", "created_at"),
    )
