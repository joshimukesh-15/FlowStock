"""Sales Order Service Layer: Order Lifecycle & Inventory Reservation."""
from typing import List
from uuid import UUID, uuid4
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.order import SalesOrder, OrderItem
from app.repositories.order import order_repo
from app.repositories.customer import customer_repo
from app.repositories.catalog import product_repo
from app.repositories.warehouse import warehouse_repo
from app.repositories.inventory import inventory_repo
from app.schemas.order import SalesOrderCreate


class OrderService:
    async def create_order(
        self, db: AsyncSession, *, organization_id: UUID, obj_in: SalesOrderCreate
    ) -> SalesOrder:
        # Validate customer
        customer = await customer_repo.get(db, id=obj_in.customer_id, organization_id=organization_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found in this organization",
            )

        # Validate warehouse or pick default
        warehouse_id = obj_in.warehouse_id
        if warehouse_id:
            wh = await warehouse_repo.get(db, id=warehouse_id, organization_id=organization_id)
            if not wh:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Specified fulfillment warehouse not found",
                )
        else:
            default_wh = await warehouse_repo.get_default(db, organization_id=organization_id)
            if default_wh:
                warehouse_id = default_wh.id

        # Generate unique order number
        order_number = f"SO-{uuid4().hex[:6].upper()}"

        # Calculate line items and total
        total_amount = 0.0
        order_items: List[OrderItem] = []

        for item_in in obj_in.items:
            product = await product_repo.get(db, id=item_in.product_id, organization_id=organization_id)
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item_in.product_id} not found in this organization",
                )

            unit_price = item_in.unit_price if item_in.unit_price is not None else product.price
            subtotal = round(unit_price * item_in.quantity, 2)
            total_amount += subtotal

            order_item = OrderItem(
                product_id=product.id,
                quantity=item_in.quantity,
                unit_price=unit_price,
                subtotal=subtotal,
            )
            order_items.append(order_item)

        sales_order = SalesOrder(
            organization_id=organization_id,
            order_number=order_number,
            customer_id=customer.id,
            warehouse_id=warehouse_id,
            status="DRAFT",
            total_amount=round(total_amount, 2),
            notes=obj_in.notes,
            items=order_items,
        )

        db.add(sales_order)
        await db.commit()
        await db.refresh(sales_order)
        return await order_repo.get_order_detail(db, organization_id=organization_id, order_id=sales_order.id)

    async def confirm_order(
        self, db: AsyncSession, *, organization_id: UUID, order_id: UUID
    ) -> SalesOrder:
        """Confirm order and reserve inventory (Allocated)."""
        order = await order_repo.get_order_detail(db, organization_id=organization_id, order_id=order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sales order not found",
            )
        if order.status != "DRAFT":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot confirm order in '{order.status}' status. Only DRAFT orders can be confirmed.",
            )

        # Validate stock availability for each item (On-Hand - Allocated >= Order Qty)
        for item in order.items:
            on_hand = await inventory_repo.get_stock_level(
                db,
                organization_id=organization_id,
                product_id=item.product_id,
                warehouse_id=order.warehouse_id,
            )
            currently_allocated = await order_repo.get_allocated_quantity(
                db, organization_id=organization_id, product_id=item.product_id
            )
            available_to_sell = on_hand - currently_allocated

            if item.quantity > available_to_sell:
                prod_name = item.product.name if item.product else str(item.product_id)
                sku = item.product.sku if item.product else "UNKNOWN"
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Insufficient available stock for product '{prod_name}' [{sku}]. "
                        f"On-Hand: {on_hand}, Already Allocated: {currently_allocated}, "
                        f"Available: {available_to_sell}, Required: {item.quantity}."
                    ),
                )

        order.status = "CONFIRMED"
        await db.commit()
        await db.refresh(order)

        cust_name = order.customer.name if order.customer else "Customer"
        from app.services.audit import audit_service
        from app.services.notification import notification_service

        await audit_service.log_action(
            db,
            organization_id=organization_id,
            action="ORDER_CONFIRMED",
            entity_type="Order",
            entity_id=order.id,
            entity_name=order.order_number,
            details=f"Order confirmed with {len(order.items)} items reserved. Total: ₹{order.total_amount:,.2f}",
        )
        await notification_service.create_notification(
            db,
            organization_id=organization_id,
            title=f"Order Confirmed: #{order.order_number}",
            message=f"Sales order #{order.order_number} confirmed for {cust_name}. Stock reserved.",
            type="INFO",
            link="/orders",
        )

        try:
            from app.core.websocket_manager import ws_manager
            await ws_manager.broadcast_to_tenant(
                organization_id,
                {
                    "event": "ORDER_UPDATED",
                    "data": {
                        "id": str(order.id),
                        "order_number": order.order_number,
                        "status": order.status,
                        "total_amount": float(order.total_amount),
                        "action": "CONFIRMED",
                    },
                },
            )
        except Exception:
            pass

        return order

    async def fulfill_order(
        self, db: AsyncSession, *, organization_id: UUID, order_id: UUID
    ) -> SalesOrder:
        """Fulfill confirmed order: deduct physical stock via append-only ledger movements."""
        order = await order_repo.get_order_detail(db, organization_id=organization_id, order_id=order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sales order not found",
            )
        if order.status != "CONFIRMED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot fulfill order in '{order.status}' status. Order must be CONFIRMED first.",
            )

        customer_name = order.customer.name if order.customer else "Customer"

        # Record OUT movement for each item in the append-only ledger
        for item in order.items:
            await inventory_repo.record_movement(
                db,
                organization_id=organization_id,
                product_id=item.product_id,
                warehouse_id=order.warehouse_id,
                movement_type="OUT",
                quantity_change=-abs(item.quantity),
                reference=f"Order {order.order_number}",
                notes=f"Order fulfillment for {customer_name}",
            )

        order.status = "FULFILLED"
        await db.commit()
        await db.refresh(order)

        from app.services.audit import audit_service
        from app.services.notification import notification_service

        await audit_service.log_action(
            db,
            organization_id=organization_id,
            action="ORDER_FULFILLED",
            entity_type="Order",
            entity_id=order.id,
            entity_name=order.order_number,
            details=f"Order fulfilled for {customer_name}. Physical stock deducted.",
        )
        await notification_service.create_notification(
            db,
            organization_id=organization_id,
            title=f"Order Fulfilled: #{order.order_number}",
            message=f"Order #{order.order_number} fulfilled and ready for dispatch.",
            type="SUCCESS",
            link="/orders",
        )

        try:
            from app.core.websocket_manager import ws_manager
            await ws_manager.broadcast_to_tenant(
                organization_id,
                {
                    "event": "ORDER_UPDATED",
                    "data": {
                        "id": str(order.id),
                        "order_number": order.order_number,
                        "status": order.status,
                        "total_amount": float(order.total_amount),
                        "action": "FULFILLED",
                    },
                },
            )
        except Exception:
            pass

        return order

    async def cancel_order(
        self, db: AsyncSession, *, organization_id: UUID, order_id: UUID
    ) -> SalesOrder:
        """Cancel order. If CONFIRMED, reservation is automatically released."""
        order = await order_repo.get_order_detail(db, organization_id=organization_id, order_id=order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sales order not found",
            )
        if order.status in ["FULFILLED", "CANCELLED"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel order in '{order.status}' status.",
            )

        order.status = "CANCELLED"
        await db.commit()
        await db.refresh(order)

        from app.services.audit import audit_service
        from app.services.notification import notification_service

        await audit_service.log_action(
            db,
            organization_id=organization_id,
            action="ORDER_CANCELLED",
            entity_type="Order",
            entity_id=order.id,
            entity_name=order.order_number,
            details="Order cancelled and inventory reservations released.",
        )
        await notification_service.create_notification(
            db,
            organization_id=organization_id,
            title=f"Order Cancelled: #{order.order_number}",
            message=f"Order #{order.order_number} cancelled. Reserved stock released.",
            type="WARNING",
            link="/orders",
        )

        try:
            from app.core.websocket_manager import ws_manager
            await ws_manager.broadcast_to_tenant(
                organization_id,
                {
                    "event": "ORDER_UPDATED",
                    "data": {
                        "id": str(order.id),
                        "order_number": order.order_number,
                        "status": order.status,
                        "total_amount": float(order.total_amount),
                        "action": "CANCELLED",
                    },
                },
            )
        except Exception:
            pass

        return order


order_service = OrderService()
