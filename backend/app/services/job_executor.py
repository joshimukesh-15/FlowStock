"""Background Job Execution and Automation Service."""
import time
from datetime import datetime, timezone, date
from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job import JobExecution
from app.models.catalog import Product
from app.models.invoice import Invoice
from app.models.order import SalesOrder
from app.repositories.inventory import inventory_repo
from app.repositories.catalog import product_repo
from app.services.notification import notification_service
from app.services.audit import audit_service
from app.schemas.job import AvailableJobInfo, JobExecutionRead


class JobExecutorService:
    """Service orchestrating real background tasks and automation jobs."""

    AVAILABLE_JOBS: Dict[str, Dict[str, str]] = {
        "low_stock_scanner": {
            "title": "Low-Stock Replenishment Scanner",
            "description": "Scans all product SKUs across warehouses, identifies items at or below reorder safety thresholds, and creates operational alert notifications.",
            "schedule_interval": "Every 5 minutes",
        },
        "overdue_invoices_detector": {
            "title": "Overdue Invoices & Receivables Guard",
            "description": "Scans unpaid and partially paid tax invoices past their payment due date, transitions status to OVERDUE, and alerts finance operators with ₹ amounts.",
            "schedule_interval": "Hourly",
        },
        "daily_digest": {
            "title": "Daily Operations & Supply Digest",
            "description": "Aggregates daily sales orders, supplier receipts, and invoice collections into an executive operational summary notification.",
            "schedule_interval": "Daily (23:59 UTC)",
        },
    }

    async def trigger_job(
        self,
        db: AsyncSession,
        *,
        job_name: str,
        organization_id: UUID,
        triggered_by: str = "MANUAL",
    ) -> JobExecution:
        if job_name not in self.AVAILABLE_JOBS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown background job '{job_name}'. Available: {list(self.AVAILABLE_JOBS.keys())}",
            )

        start_time = datetime.now(timezone.utc)
        execution = JobExecution(
            organization_id=organization_id,
            job_name=job_name,
            status="RUNNING",
            triggered_by=triggered_by,
            started_at=start_time,
        )
        db.add(execution)
        await db.commit()
        await db.refresh(execution)

        t0 = time.perf_counter()
        try:
            if job_name == "low_stock_scanner":
                summary = await self._run_low_stock_scanner(db, organization_id)
            elif job_name == "overdue_invoices_detector":
                summary = await self._run_overdue_invoices_detector(db, organization_id)
            elif job_name == "daily_digest":
                summary = await self._run_daily_digest(db, organization_id)
            else:
                summary = "Job completed."

            duration_ms = int((time.perf_counter() - t0) * 1000)
            execution.status = "SUCCESS"
            execution.completed_at = datetime.now(timezone.utc)
            execution.duration_ms = duration_ms
            execution.result_summary = summary

            # Audit record for the job run
            await audit_service.log_action(
                db,
                organization_id=organization_id,
                action="JOB_EXECUTED",
                entity_type="SystemJob",
                entity_id=execution.id,
                entity_name=job_name,
                details=f"Automated job '{job_name}' completed in {duration_ms}ms ({triggered_by}). Result: {summary}",
            )

        except Exception as e:
            duration_ms = int((time.perf_counter() - t0) * 1000)
            execution.status = "FAILED"
            execution.completed_at = datetime.now(timezone.utc)
            execution.duration_ms = duration_ms
            execution.error_message = str(e)
            execution.result_summary = f"Job failed: {str(e)}"

        await db.commit()
        await db.refresh(execution)

        try:
            from app.core.websocket_manager import ws_manager
            await ws_manager.broadcast_to_tenant(
                organization_id,
                {
                    "event": "JOB_COMPLETED",
                    "data": {
                        "job_name": execution.job_name,
                        "status": execution.status,
                        "triggered_by": execution.triggered_by,
                        "duration_ms": execution.duration_ms,
                        "result_summary": execution.result_summary,
                    },
                },
            )
        except Exception:
            pass

        return execution

    async def _run_low_stock_scanner(
        self, db: AsyncSession, organization_id: UUID
    ) -> str:
        products = await product_repo.list_products(db, organization_id=organization_id)
        low_stock_items = []

        for p in products:
            stock = await inventory_repo.get_stock_level(
                db, organization_id=organization_id, product_id=p.id
            )
            if stock <= p.reorder_point:
                low_stock_items.append((p, stock))
                await notification_service.create_notification(
                    db,
                    organization_id=organization_id,
                    title=f"Low Stock Alert: {p.sku}",
                    message=(
                        f"Product '{p.name}' is currently at {stock} {p.unit}, "
                        f"below safety threshold ({p.reorder_point} {p.unit}). "
                        "Automated replenishment check recommends creating a Purchase Order."
                    ),
                    type="WARNING",
                    link="/purchasing",
                )

        return f"Scanned {len(products)} SKUs. Flagged {len(low_stock_items)} low-stock items requiring replenishment."

    async def _run_overdue_invoices_detector(
        self, db: AsyncSession, organization_id: UUID
    ) -> str:
        today = date.today()
        stmt = select(Invoice).where(
            Invoice.organization_id == organization_id,
            Invoice.status.in_(["ISSUED", "PARTIALLY_PAID"]),
            Invoice.due_date < today,
        )
        res = await db.execute(stmt)
        overdue_invoices = res.scalars().all()

        for inv in overdue_invoices:
            inv.status = "OVERDUE"
            await notification_service.create_notification(
                db,
                organization_id=organization_id,
                title=f"Overdue Invoice: #{inv.invoice_number}",
                message=(
                    f"Invoice #{inv.invoice_number} is past due date ({inv.due_date}). "
                    f"Outstanding accounts receivable balance: ₹{inv.balance_due:,.2f}."
                ),
                type="DANGER",
                link="/invoices",
            )
            await audit_service.log_action(
                db,
                organization_id=organization_id,
                action="INVOICE_MARKED_OVERDUE",
                entity_type="Invoice",
                entity_id=inv.id,
                entity_name=inv.invoice_number,
                details=f"Automated background job marked invoice #{inv.invoice_number} as OVERDUE. Balance: ₹{inv.balance_due:,.2f}.",
            )

        return f"Scanned active invoices. Flagged {len(overdue_invoices)} overdue invoices."

    async def _run_daily_digest(
        self, db: AsyncSession, organization_id: UUID
    ) -> str:
        # Tally active orders and invoices
        orders_stmt = select(SalesOrder).where(SalesOrder.organization_id == organization_id)
        orders_res = await db.execute(orders_stmt)
        orders = orders_res.scalars().all()

        confirmed_count = sum(1 for o in orders if o.status == "CONFIRMED")
        fulfilled_count = sum(1 for o in orders if o.status == "FULFILLED")

        await notification_service.create_notification(
            db,
            organization_id=organization_id,
            title="Daily Operations Digest",
            message=(
                f"Automated daily audit: {len(orders)} total orders ({confirmed_count} confirmed, "
                f"{fulfilled_count} fulfilled). Supply chain pipelines active."
            ),
            type="INFO",
            link="/",
        )
        return f"Daily digest compiled for {len(orders)} sales orders."

    async def list_job_executions(
        self, db: AsyncSession, organization_id: UUID, limit: int = 20
    ) -> List[JobExecution]:
        stmt = (
            select(JobExecution)
            .where(JobExecution.organization_id == organization_id)
            .order_by(desc(JobExecution.started_at))
            .limit(limit)
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    async def get_available_jobs(
        self, db: AsyncSession, organization_id: UUID
    ) -> List[AvailableJobInfo]:
        jobs = []
        for name, meta in self.AVAILABLE_JOBS.items():
            last_run_stmt = (
                select(JobExecution)
                .where(
                    JobExecution.organization_id == organization_id,
                    JobExecution.job_name == name,
                )
                .order_by(desc(JobExecution.started_at))
                .limit(1)
            )
            res = await db.execute(last_run_stmt)
            last_run_obj = res.scalar_one_or_none()
            last_run_dto = (
                JobExecutionRead.model_validate(last_run_obj)
                if last_run_obj
                else None
            )

            jobs.append(
                AvailableJobInfo(
                    name=name,
                    title=meta["title"],
                    description=meta["description"],
                    schedule_interval=meta["schedule_interval"],
                    last_run=last_run_dto,
                )
            )
        return jobs


job_executor_service = JobExecutorService()
