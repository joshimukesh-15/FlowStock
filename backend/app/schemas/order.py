"""Pydantic Schemas for Sales Orders and Items."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.customer import CustomerRead
from app.schemas.warehouse import WarehouseRead
from app.schemas.catalog import ProductRead


class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(..., gt=0, description="Quantity to purchase")
    unit_price: Optional[float] = Field(None, ge=0.0, description="Unit rate in INR, defaults to product price if omitted")


class OrderItemRead(BaseModel):
    id: UUID
    order_id: UUID
    product_id: UUID
    quantity: int
    unit_price: float
    subtotal: float
    created_at: datetime
    updated_at: datetime
    product: Optional[ProductRead] = None

    model_config = ConfigDict(from_attributes=True)


class SalesOrderBase(BaseModel):
    customer_id: UUID
    warehouse_id: Optional[UUID] = None
    notes: Optional[str] = Field(None, max_length=255)


class SalesOrderCreate(SalesOrderBase):
    items: List[OrderItemCreate] = Field(..., min_length=1, description="Order must contain at least one line item")


class SalesOrderRead(SalesOrderBase):
    id: UUID
    organization_id: UUID
    order_number: str
    status: str
    total_amount: float
    created_at: datetime
    updated_at: datetime
    customer: Optional[CustomerRead] = None
    warehouse: Optional[WarehouseRead] = None
    items: List[OrderItemRead] = []

    model_config = ConfigDict(from_attributes=True)
