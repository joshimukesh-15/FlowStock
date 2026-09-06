"""Customer Database Model."""
from typing import Optional
from sqlalchemy import String, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import TenantScopedModel


class Customer(TenantScopedModel):
    """B2B Customer or client profile scoped to an organization."""
    __tablename__ = "customers"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    company: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    billing_address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    shipping_address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    __table_args__ = (
        Index("ix_customers_org_email", "organization_id", "email"),
        Index("ix_customers_org_name", "organization_id", "name"),
    )
