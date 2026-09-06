"""Invoicing and Payments Database Models."""
from datetime import date, datetime, timezone
from typing import List, Optional
from uuid import UUID, uuid4
from sqlalchemy import String, Float, Integer, ForeignKey, Date, DateTime, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, TenantScopedModel
from app.models.customer import Customer
from app.models.order import SalesOrder
from app.models.catalog import Product


class Invoice(TenantScopedModel):
    """B2B tax invoice record with line items, GST taxation, and payment balance."""
    __tablename__ = "invoices"

    customer_id: Mapped[UUID] = mapped_column(
        ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    order_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("sales_orders.id", ondelete="SET NULL"), nullable=True, index=True
    )
    invoice_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(30), default="ISSUED", nullable=False, index=True
    )  # DRAFT, ISSUED, PARTIALLY_PAID, PAID, OVERDUE, VOID
    subtotal: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    tax_rate: Mapped[float] = mapped_column(Float, default=18.0, nullable=False)  # 18% GST default
    tax_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    paid_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    balance_due: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    issue_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    customer: Mapped["Customer"] = relationship("Customer", lazy="joined")
    order: Mapped[Optional["SalesOrder"]] = relationship("SalesOrder", lazy="joined")
    items: Mapped[List["InvoiceItem"]] = relationship(
        "InvoiceItem",
        back_populates="invoice",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    payments: Mapped[List["Payment"]] = relationship(
        "Payment",
        back_populates="invoice",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="Payment.payment_date.desc()",
    )

    __table_args__ = (
        UniqueConstraint("organization_id", "invoice_number", name="uq_org_invoice_number"),
        Index("ix_invoices_org_status", "organization_id", "status"),
        Index("ix_invoices_org_customer", "organization_id", "customer_id"),
        Index("ix_invoices_org_due_date", "organization_id", "due_date"),
        Index("ix_invoices_org_created", "organization_id", "created_at"),
    )


class InvoiceItem(Base, TimestampMixin):
    """Line item on a tax invoice."""
    __tablename__ = "invoice_items"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    invoice_id: Mapped[UUID] = mapped_column(
        ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True
    )
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    subtotal: Mapped[float] = mapped_column(Float, nullable=False)

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="items")
    product: Mapped[Optional["Product"]] = relationship("Product", lazy="joined")


class Payment(TenantScopedModel):
    """Payment transaction ledger entry recorded against an invoice."""
    __tablename__ = "payments"

    invoice_id: Mapped[UUID] = mapped_column(
        ForeignKey("invoices.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    payment_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    payment_method: Mapped[str] = mapped_column(
        String(50), default="BANK_TRANSFER", nullable=False
    )  # BANK_TRANSFER, UPI, CHEQUE, NET_BANKING, CASH
    reference: Mapped[str] = mapped_column(String(100), nullable=False, index=True)  # UTR / Cheque #
    payment_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="payments")

    __table_args__ = (
        UniqueConstraint("organization_id", "payment_number", name="uq_org_payment_number"),
        Index("ix_payments_org_invoice", "organization_id", "invoice_id"),
        Index("ix_payments_org_date", "organization_id", "payment_date"),
    )
