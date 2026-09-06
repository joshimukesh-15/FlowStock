"""Job Execution Pydantic Schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class JobExecutionRead(BaseModel):
    id: UUID
    organization_id: UUID
    job_name: str
    status: str  # RUNNING, SUCCESS, FAILED
    triggered_by: str  # MANUAL, SCHEDULE
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    result_summary: Optional[str] = None
    error_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AvailableJobInfo(BaseModel):
    name: str
    title: str
    description: str
    schedule_interval: str
    last_run: Optional[JobExecutionRead] = None


class JobTriggerResponse(BaseModel):
    message: str
    job_execution: JobExecutionRead
