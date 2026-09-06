"""Customer Repository Layer."""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.customer import Customer
from app.repositories.base import TenantRepository
from app.schemas.customer import CustomerCreate, CustomerUpdate


class CustomerRepository(TenantRepository[Customer]):
    def __init__(self):
        super().__init__(Customer)

    async def get_by_email(
        self, db: AsyncSession, *, organization_id: UUID, email: str
    ) -> Optional[Customer]:
        stmt = select(Customer).where(
            Customer.organization_id == organization_id,
            Customer.email == email.strip().lower(),
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_customers(
        self,
        db: AsyncSession,
        *,
        organization_id: UUID,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Customer]:
        stmt = select(Customer).where(Customer.organization_id == organization_id)
        if search:
            s = f"%{search.strip().lower()}%"
            stmt = stmt.where(
                or_(
                    Customer.name.ilike(s),
                    Customer.email.ilike(s),
                    Customer.company.ilike(s),
                )
            )
        stmt = stmt.order_by(Customer.name.asc()).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def create_customer(
        self, db: AsyncSession, *, obj_in: CustomerCreate, organization_id: UUID
    ) -> Customer:
        customer = Customer(
            organization_id=organization_id,
            name=obj_in.name.strip(),
            email=obj_in.email.strip().lower(),
            phone=obj_in.phone.strip() if obj_in.phone else None,
            company=obj_in.company.strip() if obj_in.company else None,
            billing_address=obj_in.billing_address,
            shipping_address=obj_in.shipping_address,
        )
        db.add(customer)
        await db.commit()
        await db.refresh(customer)
        return customer

    async def update_customer(
        self, db: AsyncSession, *, customer: Customer, obj_in: CustomerUpdate
    ) -> Customer:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "email" and value:
                setattr(customer, field, value.strip().lower())
            elif isinstance(value, str):
                setattr(customer, field, value.strip())
            else:
                setattr(customer, field, value)
        await db.commit()
        await db.refresh(customer)
        return customer


customer_repo = CustomerRepository()
