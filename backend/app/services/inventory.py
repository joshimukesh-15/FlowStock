"""Inventory Business Logic Service."""
from typing import List
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.inventory import InventoryMovement
from app.repositories.inventory import inventory_repo
from app.repositories.catalog import product_repo
from app.schemas.inventory import InventoryMovementCreate, ProductStockSummary
from app.schemas.catalog import ProductRead


class InventoryService:
    async def get_stock_level(
        self, db: AsyncSession, organization_id: UUID, product_id: UUID
    ) -> int:
        return await inventory_repo.get_stock_level(
            db, organization_id=organization_id, product_id=product_id
        )

    async def list_movements(
        self, db: AsyncSession, organization_id: UUID, product_id: UUID
    ) -> List[InventoryMovement]:
        # Validate product belongs to tenant
        product = await product_repo.get_by_tenant(
            db, id=product_id, organization_id=organization_id
        )
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found in this organization.",
            )
        return await inventory_repo.list_movements_for_product(
            db, organization_id=organization_id, product_id=product_id
        )

    async def record_movement(
        self, db: AsyncSession, organization_id: UUID, obj_in: InventoryMovementCreate
    ) -> InventoryMovement:
        # Validate product exists and belongs to tenant
        product = await product_repo.get_by_tenant(
            db, id=obj_in.product_id, organization_id=organization_id
        )
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found in this organization.",
            )

        warehouse_id = obj_in.warehouse_id
        current_stock = await inventory_repo.get_stock_level(
            db,
            organization_id=organization_id,
            product_id=obj_in.product_id,
            warehouse_id=warehouse_id,
        )

        # Determine quantity change based on movement type
        if obj_in.movement_type == "IN":
            qty_change = obj_in.quantity
        elif obj_in.movement_type == "OUT":
            if current_stock < obj_in.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Insufficient stock for '{product.name}' (SKU: {product.sku}). "
                        f"Available: {current_stock} {product.unit}, requested deduction: {obj_in.quantity} {product.unit}. "
                        "Negative stock is strictly blocked."
                    ),
                )
            qty_change = -obj_in.quantity
        elif obj_in.movement_type == "ADJUSTMENT":
            # Target count adjustment: sets on-hand to obj_in.quantity
            qty_change = obj_in.quantity - current_stock
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown movement type: {obj_in.movement_type}",
            )

        movement = await inventory_repo.record_movement(
            db,
            organization_id=organization_id,
            product_id=obj_in.product_id,
            warehouse_id=warehouse_id,
            movement_type=obj_in.movement_type,
            quantity_change=qty_change,
            reference=obj_in.reference,
            notes=obj_in.notes,
        )

        from app.services.audit import audit_service
        from app.services.notification import notification_service

        new_stock = current_stock + qty_change
        await audit_service.log_action(
            db,
            organization_id=organization_id,
            action=f"STOCK_{obj_in.movement_type}",
            entity_type="Inventory",
            entity_id=product.id,
            entity_name=f"{product.name} ({product.sku})",
            details=f"Movement {obj_in.movement_type}: {qty_change:+d} {product.unit}. New balance: {new_stock} {product.unit}. Ref: {obj_in.reference}",
        )

        if new_stock <= product.reorder_point:
            await notification_service.create_notification(
                db,
                organization_id=organization_id,
                title=f"Low Stock Alert: {product.sku}",
                message=f"Product '{product.name}' has dropped to {new_stock} {product.unit} (Safety threshold: {product.reorder_point} {product.unit}). Replenishment recommended.",
                type="WARNING",
                link="/purchasing",
            )

        try:
            from app.core.websocket_manager import ws_manager
            await ws_manager.broadcast_to_tenant(
                organization_id,
                {
                    "event": "INVENTORY_UPDATED",
                    "data": {
                        "product_id": str(product.id),
                        "sku": product.sku,
                        "movement_type": obj_in.movement_type,
                        "quantity_change": qty_change,
                        "new_stock": new_stock,
                    },
                },
            )
        except Exception:
            pass

        return movement

    async def list_inventory_summaries(
        self, db: AsyncSession, organization_id: UUID
    ) -> List[ProductStockSummary]:
        products = await product_repo.list_products(db, organization_id=organization_id)
        stock_map = await inventory_repo.get_all_stock_levels(db, organization_id=organization_id)
        summaries = []

        for p in products:
            stock = stock_map.get(p.id, 0)
            is_low = stock <= p.reorder_point
            summaries.append(
                ProductStockSummary(
                    product=ProductRead.model_validate(p),
                    on_hand_quantity=stock,
                    reorder_point=p.reorder_point,
                    is_low_stock=is_low,
                    total_cost_value=round(stock * p.cost_price, 2),
                    total_retail_value=round(stock * p.price, 2),
                )
            )
        return summaries


inventory_service = InventoryService()
