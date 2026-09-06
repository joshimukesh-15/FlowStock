"""Stock Transfer Database Model (Logistics State Machine)."""
from typing import Optional
from uuid import UUID, uuid4
from sqlalchemy import String, Integer, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, TenantScopedModel
from app.models.warehouse import Warehouse
from app.models.catalog import Product


class StockTransfer(TenantScopedModel):
    """Inter-warehouse inventory transfer tracking entity."""
    __tablename__ = "stock_transfers"

    transfer_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    source_warehouse_id: Mapped[UUID] = mapped_column(
        ForeignKey("warehouses.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    destination_warehouse_id: Mapped[UUID] = mapped_column(
        ForeignKey("warehouses.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[UUID] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30),
        default="REQUESTED",
        nullable=False,
        index=True,
    )  # "REQUESTED", "IN_TRANSIT", "RECEIVED", "CANCELLED"
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    source_warehouse: Mapped["Warehouse"] = relationship(
        "Warehouse", foreign_keys=[source_warehouse_id], lazy="joined"
    )
    destination_warehouse: Mapped["Warehouse"] = relationship(
        "Warehouse", foreign_keys=[destination_warehouse_id], lazy="joined"
    )
    product: Mapped["Product"] = relationship("Product", lazy="joined")

    __table_args__ = (
        Index("ix_transfers_org_status", "organization_id", "status"),
        Index("ix_transfers_org_product", "organization_id", "product_id"),
        Index("ix_transfers_org_created", "organization_id", "created_at"),
    )
