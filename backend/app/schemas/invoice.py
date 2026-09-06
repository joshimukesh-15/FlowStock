"""Pydantic Schemas for Invoicing and Payment Transactions."""
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.customer import CustomerRead
from app.schemas.order import SalesOrderRead
from app.schemas.catalog import ProductRead


class InvoiceItemCreate(BaseModel):
    description: str = Field(..., min_length=1, max_length=255)
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., ge=0.0)
    product_id: Optional[UUID] = None


class InvoiceItemRead(BaseModel):
    id: UUID
    invoice_id: UUID
    product_id: Optional[UUID] = None
    description: str
    quantity: int
    unit_price: float
    subtotal: float
    product: Optional[ProductRead] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentCreate(BaseModel):
    invoice_id: UUID
    amount: float = Field(..., gt=0.0, description="Amount paid in INR")
    payment_method: str = Field(default="BANK_TRANSFER", pattern="^(BANK_TRANSFER|UPI|CHEQUE|NET_BANKING|CASH)$")
    reference: str = Field(..., min_length=1, max_length=100, description="Transaction ID / UTR / Cheque number")
    notes: Optional[str] = Field(None, max_length=255)


class PaymentRead(BaseModel):
    id: UUID
    organization_id: UUID
    invoice_id: UUID
    payment_number: str
    amount: float
    payment_method: str
    reference: str
    payment_date: datetime
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvoiceCreate(BaseModel):
    customer_id: UUID
    order_id: Optional[UUID] = None
    tax_rate: float = Field(default=18.0, ge=0.0, le=100.0, description="GST tax rate percentage (default 18%)")
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=255)
    items: List[InvoiceItemCreate] = Field(..., min_length=1, description="Invoice must have at least one line item")


class InvoiceRead(BaseModel):
    id: UUID
    organization_id: UUID
    customer_id: UUID
    order_id: Optional[UUID] = None
    invoice_number: str
    status: str
    subtotal: float
    tax_rate: float
    tax_amount: float
    total_amount: float
    paid_amount: float
    balance_due: float
    issue_date: date
    due_date: date
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    customer: Optional[CustomerRead] = None
    order: Optional[SalesOrderRead] = None
    items: List[InvoiceItemRead] = []
    payments: List[PaymentRead] = []

    model_config = ConfigDict(from_attributes=True)
