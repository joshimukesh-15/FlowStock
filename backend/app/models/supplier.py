"""Supplier Database Model."""
from typing import Optional
from sqlalchemy import String, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import TenantScopedModel


class Supplier(TenantScopedModel):
    """B2B Supplier or vendor profile scoped to an organization."""
    __tablename__ = "suppliers"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    company: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    payment_terms: Mapped[Optional[str]] = mapped_column(String(50), default="Net 30", nullable=True)

    __table_args__ = (
        Index("ix_suppliers_org_email", "organization_id", "email"),
        Index("ix_suppliers_org_name", "organization_id", "name"),
    )
