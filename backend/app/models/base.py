"""Base Database Models and Multi-Tenant Mixins."""
from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base declarative class for all models."""
    pass


class TimestampMixin:
    """Mixin providing created_at and updated_at timestamps."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class TenantScopedModel(Base, TimestampMixin):
    """Abstract model enforcing UUID primary key and organization_id multi-tenancy."""
    __abstract__ = True

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
        index=True,
    )
    organization_id: Mapped[UUID] = mapped_column(
        index=True,
        nullable=False,
    )
