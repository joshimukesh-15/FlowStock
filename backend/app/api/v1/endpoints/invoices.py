"""Invoicing and Payments API Endpoints."""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import (
    get_current_tenant_id,
    get_current_user,
    require_admin,
    require_sales_or_admin,
)
from app.models.user import User
from app.core.database import get_db
from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceRead,
    PaymentCreate,
    PaymentRead,
)
from app.services.invoice import invoice_service

router = APIRouter()


@router.get("", response_model=List[InvoiceRead])
async def list_invoices(
    status: Optional[str] = Query(None, description="Filter by status (DRAFT, ISSUED, PARTIALLY_PAID, PAID, OVERDUE, VOID)"),
    customer_id: Optional[UUID] = Query(None, description="Filter by customer"),
    order_id: Optional[UUID] = Query(None, description="Filter by sales order"),
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """List tenant invoices with customer details, itemized totals, and payment balance."""
    return await invoice_service.list_invoices(
        db,
        organization_id=organization_id,
        status_filter=status,
        customer_id=customer_id,
        order_id=order_id,
    )


@router.post("", response_model=InvoiceRead, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    invoice_in: InvoiceCreate,
    current_user: User = Depends(require_sales_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Create a new B2B tax invoice with line items, GST calculation, and payment terms."""
    return await invoice_service.create_invoice(
        db, organization_id=organization_id, obj_in=invoice_in
    )


@router.post("/from-order/{order_id}", response_model=InvoiceRead, status_code=status.HTTP_201_CREATED)
async def create_invoice_from_order(
    order_id: UUID,
    tax_rate: float = Query(18.0, ge=0.0, le=100.0, description="GST tax percentage"),
    current_user: User = Depends(require_sales_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Generate a formal tax invoice directly from a confirmed or fulfilled sales order."""
    return await invoice_service.create_invoice_from_order(
        db, organization_id=organization_id, order_id=order_id, tax_rate=tax_rate
    )


@router.get("/{invoice_id}", response_model=InvoiceRead)
async def get_invoice(
    invoice_id: UUID,
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Get complete invoice manifest with customer, line items, and payment transaction history."""
    return await invoice_service.get_invoice(
        db, organization_id=organization_id, invoice_id=invoice_id
    )


@router.post("/{invoice_id}/issue", response_model=InvoiceRead)
async def issue_invoice(
    invoice_id: UUID,
    current_user: User = Depends(require_sales_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Formally issue and post a draft invoice to accounts receivable."""
    return await invoice_service.issue_invoice(
        db, organization_id=organization_id, invoice_id=invoice_id
    )


@router.post("/{invoice_id}/void", response_model=InvoiceRead)
async def void_invoice(
    invoice_id: UUID,
    current_user: User = Depends(require_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Void an uncollected invoice (Admin only)."""
    return await invoice_service.void_invoice(
        db, organization_id=organization_id, invoice_id=invoice_id
    )


# --- Payments Router ---
payments_router = APIRouter()


@payments_router.get("", response_model=List[PaymentRead])
async def list_payments(
    invoice_id: Optional[UUID] = Query(None, description="Filter payments by invoice"),
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """List payment transactions with reference numbers and payment methods."""
    return await invoice_service.list_payments(
        db, organization_id=organization_id, invoice_id=invoice_id
    )


@payments_router.post("", response_model=InvoiceRead, status_code=status.HTTP_201_CREATED)
async def record_payment(
    payment_in: PaymentCreate,
    current_user: User = Depends(require_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Record a payment against an invoice and update the outstanding balance and payment status (Admin only)."""
    return await invoice_service.record_payment(
        db, organization_id=organization_id, obj_in=payment_in
    )
