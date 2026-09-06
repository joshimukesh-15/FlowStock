"""Category and Product Database Models."""
from typing import List, Optional
from uuid import UUID, uuid4
from sqlalchemy import String, Float, Integer, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, TenantScopedModel


class Category(TenantScopedModel):
    """Category classification entity scoped to an organization."""
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    products: Mapped[List["Product"]] = relationship(
        "Product",
        back_populates="category",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class Product(TenantScopedModel):
    """Product/SKU entity scoped to an organization."""
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    sku: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    unit: Mapped[str] = mapped_column(String(20), default="pcs", nullable=False)
    price: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    cost_price: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    reorder_point: Mapped[int] = mapped_column(Integer, default=10, nullable=False)

    category_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    category: Mapped[Optional["Category"]] = relationship(
        "Category",
        back_populates="products",
        lazy="joined",
    )

    __table_args__ = (
        UniqueConstraint("organization_id", "sku", name="uq_org_product_sku"),
    )
