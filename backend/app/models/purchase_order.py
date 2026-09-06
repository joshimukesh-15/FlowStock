"""Purchase Order and PO Items Database Models."""
from typing import List, Optional
from uuid import UUID, uuid4
from sqlalchemy import String, Float, Integer, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, TenantScopedModel
from app.models.supplier import Supplier
from app.models.catalog import Product
from app.models.warehouse import Warehouse


class PurchaseOrder(TenantScopedModel):
    """Purchase order entity representing inbound procurement from a vendor."""
    __tablename__ = "purchase_orders"

    po_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    supplier_id: Mapped[UUID] = mapped_column(ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False, index=True)
    destination_warehouse_id: Mapped[UUID] = mapped_column(ForeignKey("warehouses.id", ondelete="RESTRICT"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(30), default="DRAFT", nullable=False, index=True)
    total_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    supplier: Mapped["Supplier"] = relationship("Supplier", lazy="joined")
    destination_warehouse: Mapped["Warehouse"] = relationship("Warehouse", lazy="joined")
    items: Mapped[List["PurchaseOrderItem"]] = relationship(
        "PurchaseOrderItem",
        back_populates="purchase_order",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        UniqueConstraint("organization_id", "po_number", name="uq_org_po_number"),
        Index("ix_pos_org_status", "organization_id", "status"),
        Index("ix_pos_org_supplier", "organization_id", "supplier_id"),
        Index("ix_pos_org_created", "organization_id", "created_at"),
    )


class PurchaseOrderItem(Base, TimestampMixin):
    """Individual line item within a purchase order."""
    __tablename__ = "purchase_order_items"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    purchase_order_id: Mapped[UUID] = mapped_column(ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_cost: Mapped[float] = mapped_column(Float, nullable=False)
    subtotal: Mapped[float] = mapped_column(Float, nullable=False)

    purchase_order: Mapped["PurchaseOrder"] = relationship("PurchaseOrder", back_populates="items")
    product: Mapped["Product"] = relationship("Product", lazy="joined")
