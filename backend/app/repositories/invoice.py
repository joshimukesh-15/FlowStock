"""Invoice and Payment Repository Layer."""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.invoice import Invoice, InvoiceItem, Payment
from app.repositories.base import TenantRepository


class InvoiceRepository(TenantRepository[Invoice]):
    def __init__(self):
        super().__init__(Invoice)

    async def get_invoice_detail(
        self, db: AsyncSession, *, organization_id: UUID, invoice_id: UUID
    ) -> Optional[Invoice]:
        stmt = (
            select(Invoice)
            .where(
                Invoice.organization_id == organization_id,
                Invoice.id == invoice_id,
            )
            .options(
                joinedload(Invoice.customer),
                joinedload(Invoice.order),
                selectinload(Invoice.items).joinedload(InvoiceItem.product),
                selectinload(Invoice.payments),
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_invoices(
        self,
        db: AsyncSession,
        *,
        organization_id: UUID,
        status: Optional[str] = None,
        customer_id: Optional[UUID] = None,
        order_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Invoice]:
        stmt = (
            select(Invoice)
            .where(Invoice.organization_id == organization_id)
            .options(
                joinedload(Invoice.customer),
                joinedload(Invoice.order),
                selectinload(Invoice.payments),
                selectinload(Invoice.items),
            )
        )
        if status and status.upper() != "ALL":
            stmt = stmt.where(Invoice.status == status.upper())
        if customer_id:
            stmt = stmt.where(Invoice.customer_id == customer_id)
        if order_id:
            stmt = stmt.where(Invoice.order_id == order_id)

        stmt = stmt.order_by(Invoice.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_invoice_number(
        self, db: AsyncSession, *, organization_id: UUID, invoice_number: str
    ) -> Optional[Invoice]:
        stmt = select(Invoice).where(
            Invoice.organization_id == organization_id,
            Invoice.invoice_number == invoice_number,
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()


class PaymentRepository(TenantRepository[Payment]):
    def __init__(self):
        super().__init__(Payment)

    async def list_payments(
        self,
        db: AsyncSession,
        *,
        organization_id: UUID,
        invoice_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Payment]:
        stmt = select(Payment).where(Payment.organization_id == organization_id)
        if invoice_id:
            stmt = stmt.where(Payment.invoice_id == invoice_id)

        stmt = stmt.order_by(Payment.payment_date.desc()).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())


invoice_repo = InvoiceRepository()
payment_repo = PaymentRepository()
