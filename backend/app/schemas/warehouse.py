"""Pydantic Schemas for Warehouses."""
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class WarehouseBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=30)
    location: str = Field(default="Main Depot", max_length=150)
    is_default: bool = False


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseRead(WarehouseBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
