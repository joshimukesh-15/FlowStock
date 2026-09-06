"""Pydantic Schemas for Stock Transfers."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.warehouse import WarehouseRead
from app.schemas.catalog import ProductRead


class StockTransferCreate(BaseModel):
    source_warehouse_id: UUID
    destination_warehouse_id: UUID
    product_id: UUID
    quantity: int = Field(..., gt=0, description="Transfer quantity magnitude")
    notes: Optional[str] = None


class StockTransferRead(BaseModel):
    id: UUID
    transfer_number: str
    source_warehouse_id: UUID
    destination_warehouse_id: UUID
    product_id: UUID
    quantity: int
    status: str
    notes: Optional[str] = None
    organization_id: UUID
    created_at: datetime
    updated_at: datetime

    source_warehouse: Optional[WarehouseRead] = None
    destination_warehouse: Optional[WarehouseRead] = None
    product: Optional[ProductRead] = None

    model_config = ConfigDict(from_attributes=True)
