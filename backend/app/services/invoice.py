"""Invoicing and Payments Business Logic Service."""
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID, uuid4
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.invoice import Invoice, InvoiceItem, Payment
from app.repositories.invoice import invoice_repo, payment_repo
from app.repositories.customer import customer_repo
from app.repositories.order import order_repo
from app.schemas.invoice import InvoiceCreate, PaymentCreate


class InvoiceService:
    async def create_invoice(
        self, db: AsyncSession, organization_id: UUID, obj_in: InvoiceCreate
    ) -> Invoice:
        # Validate customer
        customer = await customer_repo.get_by_tenant(
            db, id=obj_in.customer_id, organization_id=organization_id
        )
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found in this organization.",
            )

        # Validate order if provided
        if obj_in.order_id:
            order = await order_repo.get_by_tenant(
                db, id=obj_in.order_id, organization_id=organization_id
            )
            if not order:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Sales order not found in this organization.",
                )

        # Compute line item subtotals
        subtotal = 0.0
        db_items = []
        for item in obj_in.items:
            item_sub = round(item.quantity * item.unit_price, 2)
            subtotal += item_sub
            db_items.append(
                InvoiceItem(
                    product_id=item.product_id,
                    description=item.description,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    subtotal=item_sub,
                )
            )

        subtotal = round(subtotal, 2)
        tax_amount = round(subtotal * (obj_in.tax_rate / 100.0), 2)
        total_amount = round(subtotal + tax_amount, 2)

        issue_date = obj_in.issue_date or date.today()
        due_date = obj_in.due_date or (issue_date + timedelta(days=30))

        invoice_number = f"INV-{str(uuid4())[:6].upper()}"

        invoice = Invoice(
            organization_id=organization_id,
            customer_id=customer.id,
            order_id=obj_in.order_id,
            invoice_number=invoice_number,
            status="ISSUED",
            subtotal=subtotal,
            tax_rate=obj_in.tax_rate,
            tax_amount=tax_amount,
            total_amount=total_amount,
            paid_amount=0.0,
            balance_due=total_amount,
            issue_date=issue_date,
            due_date=due_date,
            notes=obj_in.notes,
        )

        for item_obj in db_items:
            invoice.items.append(item_obj)

        db.add(invoice)
        await db.commit()

        return await invoice_repo.get_invoice_detail(
            db, organization_id=organization_id, invoice_id=invoice.id
        )

    async def create_invoice_from_order(
        self,
        db: AsyncSession,
        organization_id: UUID,
        order_id: UUID,
        tax_rate: float = 18.0,
    ) -> Invoice:
        order = await order_repo.get_order_detail(
            db, organization_id=organization_id, order_id=order_id
        )
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sales order not found in this organization.",
            )

        if order.status not in ["CONFIRMED", "FULFILLED"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot generate invoice for order in '{order.status}' status. Order must be CONFIRMED or FULFILLED.",
            )

        # Build items from order line items
        items_payload = []
        for item in order.items:
            prod_name = item.product.name if item.product else "Product"
            prod_sku = f" ({item.product.sku})" if item.product and item.product.sku else ""
            items_payload.append(
                InvoiceItem(
                    product_id=item.product_id,
                    description=f"{prod_name}{prod_sku}",
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    subtotal=item.subtotal,
                )
            )

        subtotal = round(sum(i.subtotal for i in items_payload), 2)
        tax_amount = round(subtotal * (tax_rate / 100.0), 2)
        total_amount = round(subtotal + tax_amount, 2)

        issue_d = date.today()
        due_d = issue_d + timedelta(days=30)
        invoice_number = f"INV-{str(uuid4())[:6].upper()}"

        invoice = Invoice(
            organization_id=organization_id,
            customer_id=order.customer_id,
            order_id=order.id,
            invoice_number=invoice_number,
            status="ISSUED",
            subtotal=subtotal,
            tax_rate=tax_rate,
            tax_amount=tax_amount,
            total_amount=total_amount,
            paid_amount=0.0,
            balance_due=total_amount,
            issue_date=issue_d,
            due_date=due_d,
            notes=f"Tax invoice generated from Sales Order {order.order_number}",
        )

        for item_obj in items_payload:
            invoice.items.append(item_obj)

        db.add(invoice)
        await db.commit()

        return await invoice_repo.get_invoice_detail(
            db, organization_id=organization_id, invoice_id=invoice.id
        )

    async def get_invoice(
        self, db: AsyncSession, organization_id: UUID, invoice_id: UUID
    ) -> Invoice:
        invoice = await invoice_repo.get_invoice_detail(
            db, organization_id=organization_id, invoice_id=invoice_id
        )
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found in this organization.",
            )
        return invoice

    async def list_invoices(
        self,
        db: AsyncSession,
        organization_id: UUID,
        status_filter: Optional[str] = None,
        customer_id: Optional[UUID] = None,
        order_id: Optional[UUID] = None,
    ) -> List[Invoice]:
        return await invoice_repo.list_invoices(
            db,
            organization_id=organization_id,
            status=status_filter,
            customer_id=customer_id,
            order_id=order_id,
        )

    async def issue_invoice(
        self, db: AsyncSession, organization_id: UUID, invoice_id: UUID
    ) -> Invoice:
        invoice = await self.get_invoice(db, organization_id, invoice_id)
        if invoice.status != "DRAFT":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot issue invoice in '{invoice.status}' status. Must be 'DRAFT'.",
            )
        invoice.status = "ISSUED"
        await db.commit()
        return await invoice_repo.get_invoice_detail(
            db, organization_id=organization_id, invoice_id=invoice.id
        )

    async def void_invoice(
        self, db: AsyncSession, organization_id: UUID, invoice_id: UUID
    ) -> Invoice:
        invoice = await self.get_invoice(db, organization_id, invoice_id)
        if invoice.paid_amount > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot void invoice with recorded payments (Total paid: {invoice.paid_amount}).",
            )
        invoice.status = "VOID"
        await db.commit()
        return await invoice_repo.get_invoice_detail(
            db, organization_id=organization_id, invoice_id=invoice.id
        )

    async def record_payment(
        self, db: AsyncSession, organization_id: UUID, obj_in: PaymentCreate
    ) -> Invoice:
        invoice = await self.get_invoice(db, organization_id, obj_in.invoice_id)

        if invoice.status in ["PAID"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invoice is already fully paid. Balance due is zero.",
            )

        if invoice.status in ["DRAFT", "VOID"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot apply payment to invoice in '{invoice.status}' status. Invoice must be ISSUED or PARTIALLY_PAID.",
            )

        if obj_in.amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment amount must be greater than zero.",
            )

        if obj_in.amount > invoice.balance_due:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Payment amount (₹{obj_in.amount:.2f}) exceeds outstanding balance due "
                    f"(₹{invoice.balance_due:.2f}). Overpayment is blocked."
                ),
            )

        payment_number = f"PAY-{str(uuid4())[:6].upper()}"

        payment = Payment(
            organization_id=organization_id,
            invoice_id=invoice.id,
            payment_number=payment_number,
            amount=obj_in.amount,
            payment_method=obj_in.payment_method,
            reference=obj_in.reference,
            notes=obj_in.notes,
        )

        invoice.payments.append(payment)
        invoice.paid_amount = round(invoice.paid_amount + obj_in.amount, 2)
        invoice.balance_due = round(invoice.total_amount - invoice.paid_amount, 2)

        if invoice.balance_due <= 0.0:
            invoice.balance_due = 0.0
            invoice.status = "PAID"
        else:
            invoice.status = "PARTIALLY_PAID"

        db.add(payment)
        await db.commit()

        from app.services.audit import audit_service
        from app.services.notification import notification_service

        await audit_service.log_action(
            db,
            organization_id=organization_id,
            action="PAYMENT_RECORDED",
            entity_type="Payment",
            entity_id=payment.id,
            entity_name=payment.payment_number,
            details=f"Payment of ₹{payment.amount:,.2f} recorded for Invoice #{invoice.invoice_number} via {payment.payment_method} (Ref: {payment.reference}). Remaining balance: ₹{invoice.balance_due:,.2f}.",
        )
        await notification_service.create_notification(
            db,
            organization_id=organization_id,
            title=f"Payment Received: ₹{payment.amount:,.2f}",
            message=f"Received payment of ₹{payment.amount:,.2f} for Invoice #{invoice.invoice_number} via {payment.payment_method} (Ref: {payment.reference}).",
            type="SUCCESS",
            link="/invoices",
        )

        return await invoice_repo.get_invoice_detail(
            db, organization_id=organization_id, invoice_id=invoice.id
        )

    async def list_payments(
        self,
        db: AsyncSession,
        organization_id: UUID,
        invoice_id: Optional[UUID] = None,
    ) -> List[Payment]:
        return await payment_repo.list_payments(
            db, organization_id=organization_id, invoice_id=invoice_id
        )


invoice_service = InvoiceService()
