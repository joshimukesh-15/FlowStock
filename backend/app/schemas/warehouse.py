from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class WarehouseBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=30)
    location: str = Field(default="Main Depot", max_length=150)
    capacity: int = Field(default=2500, ge=1, description="Maximum storage capacity in units")
    is_default: bool = False


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=30)
    location: Optional[str] = Field(None, max_length=150)
    capacity: Optional[int] = Field(None, ge=1)
    is_default: Optional[bool] = None


class WarehouseRead(WarehouseBase):
    id: UUID
    organization_id: UUID
    capacity: int = 2500
    current_stock: int = 0
    utilization_pct: float = 0.0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
