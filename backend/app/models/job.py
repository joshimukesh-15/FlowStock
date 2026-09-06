"""Job Execution Database Model."""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import TenantScopedModel


class JobExecution(TenantScopedModel):
    """Execution record for automated and background scheduled jobs."""
    __tablename__ = "job_executions"

    job_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )  # e.g., low_stock_scanner, overdue_invoices_detector, daily_digest
    status: Mapped[str] = mapped_column(
        String(30),
        default="RUNNING",
        nullable=False,
        index=True,
    )  # RUNNING, SUCCESS, FAILED
    triggered_by: Mapped[str] = mapped_column(
        String(30),
        default="MANUAL",
        nullable=False,
    )  # MANUAL, SCHEDULE
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    duration_ms: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )
    result_summary: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
