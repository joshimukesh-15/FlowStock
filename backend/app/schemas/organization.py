"""Pydantic Schemas for Organizations and Users."""
from datetime import datetime
from typing import List
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    name: str
    email: str
    role: str = "admin"


class UserCreate(UserBase):
    pass


class UserRead(UserBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrganizationBase(BaseModel):
    name: str
    slug: str
    currency: str = "INR"


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationRead(OrganizationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    users: List[UserRead] = []

    model_config = ConfigDict(from_attributes=True)


class OrganizationSummary(OrganizationBase):
    id: UUID
    created_at: datetime
    user_count: int = 0

    model_config = ConfigDict(from_attributes=True)
