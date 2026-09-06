"""Warehouse Database Model."""
from uuid import UUID, uuid4
from sqlalchemy import String, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin, TenantScopedModel


class Warehouse(TenantScopedModel):
    """Physical storage facility/depot entity scoped to an organization."""
    __tablename__ = "warehouses"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    location: Mapped[str] = mapped_column(String(150), nullable=False, default="Default Facility")
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_org_warehouse_code"),
    )
