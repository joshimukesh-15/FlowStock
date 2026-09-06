"""Sales Order and Order Items Database Models."""
from typing import List, Optional
from uuid import UUID, uuid4
from sqlalchemy import String, Float, Integer, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, TenantScopedModel
from app.models.customer import Customer
from app.models.catalog import Product
from app.models.warehouse import Warehouse


class SalesOrder(TenantScopedModel):
    """Sales order entity with lifecycle states and inventory reservation."""
    __tablename__ = "sales_orders"

    order_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    customer_id: Mapped[UUID] = mapped_column(ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    warehouse_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("warehouses.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="DRAFT", nullable=False, index=True)
    total_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    customer: Mapped["Customer"] = relationship("Customer", lazy="joined")
    warehouse: Mapped[Optional["Warehouse"]] = relationship("Warehouse", lazy="joined")
    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        UniqueConstraint("organization_id", "order_number", name="uq_org_order_number"),
        Index("ix_sales_orders_org_status", "organization_id", "status"),
        Index("ix_sales_orders_org_customer", "organization_id", "customer_id"),
        Index("ix_sales_orders_org_created", "organization_id", "created_at"),
    )


class OrderItem(Base, TimestampMixin):
    """Individual line item belonging to a sales order."""
    __tablename__ = "order_items"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    order_id: Mapped[UUID] = mapped_column(ForeignKey("sales_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    subtotal: Mapped[float] = mapped_column(Float, nullable=False)

    order: Mapped["SalesOrder"] = relationship("SalesOrder", back_populates="items")
    product: Mapped["Product"] = relationship("Product", lazy="joined")
