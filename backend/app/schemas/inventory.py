"""Pydantic Schemas for Inventory Ledger and Stock Summaries."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.catalog import ProductRead


class InventoryMovementCreate(BaseModel):
    product_id: UUID
    warehouse_id: Optional[UUID] = None
    movement_type: str = Field(..., pattern="^(IN|OUT|ADJUSTMENT)$")
    quantity: int = Field(..., gt=0, description="Positive quantity magnitude")
    reference: str = Field(default="Manual Adjustment", min_length=1, max_length=100)
    notes: Optional[str] = None


class InventoryMovementRead(BaseModel):
    id: UUID
    product_id: UUID
    warehouse_id: Optional[UUID] = None
    movement_type: str
    quantity_change: int
    reference: str
    notes: Optional[str] = None
    organization_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductStockSummary(BaseModel):
    product: ProductRead
    on_hand_quantity: int
    reorder_point: int
    is_low_stock: bool
    total_cost_value: float
    total_retail_value: float
