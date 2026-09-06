"""Pydantic Schemas for Purchase Orders and Items."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.supplier import SupplierRead
from app.schemas.warehouse import WarehouseRead
from app.schemas.catalog import ProductRead


class PurchaseOrderItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(..., gt=0, description="Quantity to order from vendor")
    unit_cost: Optional[float] = Field(None, ge=0.0, description="Unit purchase cost in INR, defaults to product cost_price if omitted")


class PurchaseOrderItemRead(BaseModel):
    id: UUID
    purchase_order_id: UUID
    product_id: UUID
    quantity: int
    unit_cost: float
    subtotal: float
    created_at: datetime
    updated_at: datetime
    product: Optional[ProductRead] = None

    model_config = ConfigDict(from_attributes=True)


class PurchaseOrderBase(BaseModel):
    supplier_id: UUID
    destination_warehouse_id: UUID
    notes: Optional[str] = Field(None, max_length=255)


class PurchaseOrderCreate(PurchaseOrderBase):
    items: List[PurchaseOrderItemCreate] = Field(..., min_length=1, description="PO must contain at least one line item")


class PurchaseOrderRead(PurchaseOrderBase):
    id: UUID
    organization_id: UUID
    po_number: str
    status: str
    total_amount: float
    created_at: datetime
    updated_at: datetime
    supplier: Optional[SupplierRead] = None
    destination_warehouse: Optional[WarehouseRead] = None
    items: List[PurchaseOrderItemRead] = []

    model_config = ConfigDict(from_attributes=True)
