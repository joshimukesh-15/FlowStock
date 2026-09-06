"""Purchase Order Service Layer: Procurement Lifecycle & Inbound Stock Receipt."""
from typing import List, Optional
from uuid import UUID, uuid4
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.repositories.purchase_order import purchase_order_repo
from app.repositories.supplier import supplier_repo
from app.repositories.catalog import product_repo
from app.repositories.warehouse import warehouse_repo
from app.repositories.inventory import inventory_repo
from app.schemas.purchase_order import PurchaseOrderCreate


class PurchaseOrderService:
    async def create_po(
        self, db: AsyncSession, *, organization_id: UUID, obj_in: PurchaseOrderCreate
    ) -> PurchaseOrder:
        # Validate supplier
        supplier = await supplier_repo.get(db, id=obj_in.supplier_id, organization_id=organization_id)
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found in this organization",
            )

        # Validate destination warehouse
        warehouse = await warehouse_repo.get(
            db, id=obj_in.destination_warehouse_id, organization_id=organization_id
        )
        if not warehouse:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Destination receiving warehouse not found in this organization",
            )

        # Generate unique PO number
        po_number = f"PO-{uuid4().hex[:6].upper()}"

        # Calculate line items and total cost
        total_amount = 0.0
        po_items: List[PurchaseOrderItem] = []

        for item_in in obj_in.items:
            product = await product_repo.get(db, id=item_in.product_id, organization_id=organization_id)
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item_in.product_id} not found in this organization",
                )

            unit_cost = item_in.unit_cost if item_in.unit_cost is not None else product.cost_price
            subtotal = round(unit_cost * item_in.quantity, 2)
            total_amount += subtotal

            po_item = PurchaseOrderItem(
                product_id=product.id,
                quantity=item_in.quantity,
                unit_cost=unit_cost,
                subtotal=subtotal,
            )
            po_items.append(po_item)

        purchase_order = PurchaseOrder(
            organization_id=organization_id,
            po_number=po_number,
            supplier_id=supplier.id,
            destination_warehouse_id=warehouse.id,
            status="DRAFT",
            total_amount=round(total_amount, 2),
            notes=obj_in.notes,
            items=po_items,
        )

        db.add(purchase_order)
        await db.commit()
        await db.refresh(purchase_order)
        return await purchase_order_repo.get_po_detail(
            db, organization_id=organization_id, po_id=purchase_order.id
        )

    async def issue_po(
        self, db: AsyncSession, *, organization_id: UUID, po_id: UUID
    ) -> PurchaseOrder:
        """Issue PO to supplier (transfers from DRAFT to ISSUED)."""
        po = await purchase_order_repo.get_po_detail(db, organization_id=organization_id, po_id=po_id)
        if not po:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found",
            )
        if po.status != "DRAFT":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot issue PO in '{po.status}' status. Only DRAFT orders can be issued.",
            )

        po.status = "ISSUED"
        await db.commit()
        await db.refresh(po)
        return po

    async def receive_po(
        self, db: AsyncSession, *, organization_id: UUID, po_id: UUID
    ) -> PurchaseOrder:
        """Acknowledge inbound delivery: credit physical stock via append-only ledger IN movements."""
        po = await purchase_order_repo.get_po_detail(db, organization_id=organization_id, po_id=po_id)
        if not po:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found",
            )
        if po.status not in ["DRAFT", "ISSUED"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot receive PO in '{po.status}' status. PO must be DRAFT or ISSUED.",
            )

        supplier_name = po.supplier.name if po.supplier else "Supplier"

        # Record IN movement for each item in the append-only ledger
        for item in po.items:
            await inventory_repo.record_movement(
                db,
                organization_id=organization_id,
                product_id=item.product_id,
                warehouse_id=po.destination_warehouse_id,
                movement_type="IN",
                quantity_change=item.quantity,  # positive for IN
                reference=f"PO {po.po_number}",
                notes=f"Inbound goods receipt from {supplier_name}",
            )

        po.status = "RECEIVED"
        await db.commit()
        await db.refresh(po)

        from app.services.audit import audit_service
        from app.services.notification import notification_service

        await audit_service.log_action(
            db,
            organization_id=organization_id,
            action="PO_RECEIVED",
            entity_type="PurchaseOrder",
            entity_id=po.id,
            entity_name=po.po_number,
            details=f"Inbound goods received for PO #{po.po_number} from {supplier_name}. {len(po.items)} SKUs credited to inventory.",
        )
        await notification_service.create_notification(
            db,
            organization_id=organization_id,
            title=f"Inventory Received: PO #{po.po_number}",
            message=f"Received supplier shipment for PO #{po.po_number} from {supplier_name}. Inventory ledger updated.",
            type="SUCCESS",
            link="/purchasing",
        )

        return po

    async def cancel_po(
        self, db: AsyncSession, *, organization_id: UUID, po_id: UUID
    ) -> PurchaseOrder:
        """Cancel purchase order prior to goods receipt."""
        po = await purchase_order_repo.get_po_detail(db, organization_id=organization_id, po_id=po_id)
        if not po:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found",
            )
        if po.status in ["RECEIVED", "CANCELLED"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel PO in '{po.status}' status.",
            )

        po.status = "CANCELLED"
        await db.commit()
        await db.refresh(po)
        return po


purchase_order_service = PurchaseOrderService()
