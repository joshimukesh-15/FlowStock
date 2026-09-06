"""Background Jobs and Automation API Endpoints."""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_tenant_id, require_warehouse_or_admin
from app.models.user import User
from app.core.database import get_db
from app.schemas.job import JobExecutionRead, AvailableJobInfo, JobTriggerResponse
from app.services.job_executor import job_executor_service

router = APIRouter()


@router.get("/available", response_model=List[AvailableJobInfo])
async def list_available_jobs(
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """List available automated background jobs and their most recent run status."""
    return await job_executor_service.get_available_jobs(
        db, organization_id=organization_id
    )


@router.get("", response_model=List[JobExecutionRead])
async def list_job_executions(
    limit: int = Query(20, ge=1, le=100),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """List recent background job execution logs and performance metrics."""
    return await job_executor_service.list_job_executions(
        db, organization_id=organization_id, limit=limit
    )


@router.post("/{job_name}/run", response_model=JobTriggerResponse)
async def trigger_job_run(
    job_name: str,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Manually trigger background job execution."""
    execution = await job_executor_service.trigger_job(
        db, job_name=job_name, organization_id=organization_id, triggered_by="MANUAL"
    )
    return JobTriggerResponse(
        message=f"Background job '{job_name}' completed with status '{execution.status}'.",
        job_execution=JobExecutionRead.model_validate(execution),
    )
