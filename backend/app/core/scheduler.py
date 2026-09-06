"""Lightweight In-Process Async Background Task Scheduler (Zero Redis)."""
import asyncio
import logging
from typing import Optional
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.organization import Organization
from app.services.job_executor import job_executor_service

logger = logging.getLogger("flowstock.scheduler")

_scheduler_task: Optional[asyncio.Task] = None
_running: bool = False


async def _background_scheduler_loop(interval_seconds: int = 300):
    """Periodic execution loop running real async background tasks."""
    logger.info("FlowStock in-process background scheduler started (Interval: %ds)", interval_seconds)
    while _running:
        try:
            await asyncio.sleep(interval_seconds)
            if not _running:
                break

            async with AsyncSessionLocal() as session:
                orgs_stmt = select(Organization)
                orgs_res = await session.execute(orgs_stmt)
                organizations = orgs_res.scalars().all()

                for org in organizations:
                    try:
                        # 1. Run low stock scanner on schedule
                        await job_executor_service.trigger_job(
                            session,
                            job_name="low_stock_scanner",
                            organization_id=org.id,
                            triggered_by="SCHEDULE",
                        )
                        # 2. Run overdue invoices check on schedule
                        await job_executor_service.trigger_job(
                            session,
                            job_name="overdue_invoices_detector",
                            organization_id=org.id,
                            triggered_by="SCHEDULE",
                        )
                    except Exception as e:
                        logger.error("Error executing scheduled jobs for tenant %s: %s", org.slug, e)

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error("Scheduler encountered unexpected error: %s", e)
            await asyncio.sleep(10)

    logger.info("FlowStock in-process background scheduler stopped.")


def start_background_scheduler(interval_seconds: int = 300):
    """Start background scheduler loop inside current event loop."""
    global _scheduler_task, _running
    if _running:
        return
    _running = True
    _scheduler_task = asyncio.create_task(_background_scheduler_loop(interval_seconds))


def stop_background_scheduler():
    """Cancel and stop background scheduler."""
    global _scheduler_task, _running
    _running = False
    if _scheduler_task and not _scheduler_task.done():
        _scheduler_task.cancel()
