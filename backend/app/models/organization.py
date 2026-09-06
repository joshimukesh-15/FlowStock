"""Organization Database Model."""
from typing import List
from uuid import UUID, uuid4
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin


class Organization(Base, TimestampMixin):
    """Organization (Tenant) Entity."""
    __tablename__ = "organizations"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)

    users: Mapped[List["User"]] = relationship(
        "User",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
