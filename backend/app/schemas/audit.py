"""Audit Log Pydantic Schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class AuditLogBase(BaseModel):
    action: str
    entity_type: str
    entity_id: Optional[UUID] = None
    entity_name: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = "127.0.0.1"


class AuditLogCreate(AuditLogBase):
    user_id: Optional[UUID] = None
    user_name: Optional[str] = None


class AuditLogRead(AuditLogBase):
    id: UUID
    organization_id: UUID
    user_id: Optional[UUID] = None
    user_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
