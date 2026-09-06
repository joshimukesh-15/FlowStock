"""Pydantic Schemas for Shipments and Tracking Events."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.order import SalesOrderRead


class ShipmentEventCreate(BaseModel):
    status: str = Field(..., max_length=30)
    location: str = Field(..., max_length=150)
    description: str = Field(..., max_length=255)


class ShipmentEventRead(BaseModel):
    id: UUID
    shipment_id: UUID
    status: str
    location: str
    description: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShipmentBase(BaseModel):
    order_id: UUID
    carrier: str = Field(..., min_length=2, max_length=100)
    tracking_number: Optional[str] = Field(None, max_length=100)
    shipping_cost: float = Field(default=0.0, ge=0.0)
    origin_address: Optional[str] = Field(None, max_length=255)
    destination_address: Optional[str] = Field(None, max_length=255)
    estimated_delivery: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=255)


class ShipmentCreate(ShipmentBase):
    pass


class ShipmentStatusUpdate(BaseModel):
    location: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = Field(None, max_length=255)


class ShipmentRead(ShipmentBase):
    id: UUID
    organization_id: UUID
    shipment_number: str
    tracking_number: str
    status: str
    destination_address: str
    actual_delivery: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    order: Optional[SalesOrderRead] = None
    events: List[ShipmentEventRead] = []

    model_config = ConfigDict(from_attributes=True)
