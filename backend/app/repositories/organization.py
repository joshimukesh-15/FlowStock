"""Organization Repository Layer."""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.organization import Organization
from app.repositories.base import BaseRepository
from app.schemas.organization import OrganizationCreate


class OrganizationRepository(BaseRepository[Organization]):
    def __init__(self):
        super().__init__(Organization)

    async def get_by_id(self, db: AsyncSession, id: UUID) -> Optional[Organization]:
        stmt = select(Organization).where(Organization.id == id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_slug(self, db: AsyncSession, slug: str) -> Optional[Organization]:
        stmt = select(Organization).where(Organization.slug == slug)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> List[Organization]:
        stmt = select(Organization).order_by(Organization.name.asc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, db: AsyncSession, *, obj_in: OrganizationCreate) -> Organization:
        db_obj = Organization(
            name=obj_in.name,
            slug=obj_in.slug.lower().strip().replace(" ", "-"),
            currency=obj_in.currency.upper(),
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def delete_cascade(self, db: AsyncSession, id: UUID) -> bool:
        """Completely cascade delete an organization and all associated tenant records."""
        org = await self.get_by_id(db, id)
        if not org:
            return False

        from app.models.invoice import Invoice, InvoiceItem, Payment
        from app.models.shipment import Shipment, ShipmentEvent
        from app.models.order import SalesOrder, OrderItem
        from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
        from app.models.transfer import StockTransfer
        from app.models.inventory import InventoryMovement
        from app.models.catalog import Product, Category
        from app.models.warehouse import Warehouse
        from app.models.customer import Customer
        from app.models.supplier import Supplier
        from app.models.notification import Notification
        from app.models.audit import AuditLog
        from app.models.job import JobExecution
        from app.models.user import User

        # 1. Payments
        await db.execute(delete(Payment).where(Payment.organization_id == id))

        # 2. Invoices & Items
        inv_res = await db.execute(select(Invoice.id).where(Invoice.organization_id == id))
        inv_ids = list(inv_res.scalars().all())
        if inv_ids:
            await db.execute(delete(InvoiceItem).where(InvoiceItem.invoice_id.in_(inv_ids)))
        await db.execute(delete(Invoice).where(Invoice.organization_id == id))

        # 3. Shipments & Events
        ship_res = await db.execute(select(Shipment.id).where(Shipment.organization_id == id))
        ship_ids = list(ship_res.scalars().all())
        if ship_ids:
            await db.execute(delete(ShipmentEvent).where(ShipmentEvent.shipment_id.in_(ship_ids)))
        await db.execute(delete(Shipment).where(Shipment.organization_id == id))

        # 4. Sales Orders & Items
        order_res = await db.execute(select(SalesOrder.id).where(SalesOrder.organization_id == id))
        order_ids = list(order_res.scalars().all())
        if order_ids:
            await db.execute(delete(OrderItem).where(OrderItem.order_id.in_(order_ids)))
        await db.execute(delete(SalesOrder).where(SalesOrder.organization_id == id))

        # 5. Purchase Orders & Items
        po_res = await db.execute(select(PurchaseOrder.id).where(PurchaseOrder.organization_id == id))
        po_ids = list(po_res.scalars().all())
        if po_ids:
            await db.execute(delete(PurchaseOrderItem).where(PurchaseOrderItem.purchase_order_id.in_(po_ids)))
        await db.execute(delete(PurchaseOrder).where(PurchaseOrder.organization_id == id))

        # 6. Stock Transfers
        await db.execute(delete(StockTransfer).where(StockTransfer.organization_id == id))

        # 7. Inventory Movements
        await db.execute(delete(InventoryMovement).where(InventoryMovement.organization_id == id))

        # 8. Products
        await db.execute(delete(Product).where(Product.organization_id == id))

        # 9. Categories
        await db.execute(delete(Category).where(Category.organization_id == id))

        # 10. Warehouses
        await db.execute(delete(Warehouse).where(Warehouse.organization_id == id))

        # 11. Customers
        await db.execute(delete(Customer).where(Customer.organization_id == id))

        # 12. Suppliers
        await db.execute(delete(Supplier).where(Supplier.organization_id == id))

        # 13. Notifications
        await db.execute(delete(Notification).where(Notification.organization_id == id))

        # 14. Audit Logs
        await db.execute(delete(AuditLog).where(AuditLog.organization_id == id))

        # 15. Job Executions
        await db.execute(delete(JobExecution).where(JobExecution.organization_id == id))

        # 16. Users
        await db.execute(delete(User).where(User.organization_id == id))

        # 17. Organization Tenant Record
        await db.execute(delete(Organization).where(Organization.id == id))
        await db.commit()
        return True


organization_repo = OrganizationRepository()
