"""Pydantic Schemas for Suppliers."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=3, max_length=100)
    phone: Optional[str] = Field(None, max_length=30)
    company: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=255)
    payment_terms: Optional[str] = Field(default="Net 30", max_length=50)


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, min_length=3, max_length=100)
    phone: Optional[str] = Field(None, max_length=30)
    company: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=255)
    payment_terms: Optional[str] = Field(None, max_length=50)


class SupplierRead(SupplierBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
