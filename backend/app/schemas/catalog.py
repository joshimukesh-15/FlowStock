"""Pydantic Schemas for Products and Categories."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


# Category Schemas
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryRead(CategoryBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Product Schemas
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    sku: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    unit: str = "pcs"
    price: float = Field(default=0.0, ge=0.0)
    cost_price: float = Field(default=0.0, ge=0.0)
    reorder_point: int = Field(default=10, ge=0)
    category_id: Optional[UUID] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0.0)
    cost_price: Optional[float] = Field(default=None, ge=0.0)
    reorder_point: Optional[int] = Field(default=None, ge=0)
    category_id: Optional[UUID] = None


class ProductRead(ProductBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryRead] = None

    model_config = ConfigDict(from_attributes=True)
