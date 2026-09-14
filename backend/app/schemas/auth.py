"""Pydantic Schemas for Authentication."""
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    org_name: str
    org_slug: str
    currency: str = "INR"


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthUserRead(BaseModel):
    id: UUID
    name: str
    email: str
    role: str
    organization_id: UUID
    model_config = ConfigDict(from_attributes=True)


class AuthOrgRead(BaseModel):
    id: UUID
    name: str
    slug: str
    currency: str
    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserRead
    organization: AuthOrgRead
