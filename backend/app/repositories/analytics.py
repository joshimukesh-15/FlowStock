"""Analytics Database Repository (Tenant-Isolated Real Aggregations)."""
import math
from datetime import date, timedelta
from typing import List, Dict, Any
from uuid import UUID
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.catalog import Product
from app.models.inventory import InventoryMovement
from app.models.invoice import Invoice, Payment
from app.models.order import SalesOrder, OrderItem
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.models.shipment import Shipment
from app.models.warehouse import Warehouse
from app.models.supplier import Supplier


class AnalyticsRepository:
    """Repository answering operational business questions with real SQL queries."""

    async def get_inventory_metrics(
        self, db: AsyncSession, organization_id: UUID
    ) -> Dict[str, Any]:
        # 1. Fetch all products for the tenant
        prod_stmt = select(Product).where(Product.organization_id == organization_id)
        prod_res = await db.execute(prod_stmt)
        products = prod_res.scalars().all()

        # 2. Fetch stock levels grouped by product_id
        movements_stmt = (
            select(
                InventoryMovement.product_id,
                func.coalesce(func.sum(InventoryMovement.quantity_change), 0).label("stock"),
            )
            .where(InventoryMovement.organization_id == organization_id)
            .group_by(InventoryMovement.product_id)
        )
        movements_res = await db.execute(movements_stmt)
        stock_map = {row[0]: int(row[1]) for row in movements_res.all()}

        total_units = 0
        total_cost = 0.0
        total_retail = 0.0
        low_stock_items = []

        for p in products:
            p_stock = stock_map.get(p.id, 0)
            total_units += p_stock
            total_cost += p_stock * (p.cost_price or 0.0)
            total_retail += p_stock * (p.price or 0.0)

            if p_stock <= p.reorder_point:
                low_stock_items.append({
                    "product_id": p.id,
                    "name": p.name,
                    "sku": p.sku,
                    "unit": p.unit,
                    "current_stock": p_stock,
                    "reorder_point": p.reorder_point,
                })

        # Sort low stock items by most depleted (stock - reorder_point ascending)
        low_stock_items.sort(key=lambda x: (x["current_stock"] - x["reorder_point"]))

        return {
            "total_skus": len(products),
            "total_units_on_hand": total_units,
            "total_cost_valuation": round(total_cost, 2),
            "total_retail_valuation": round(total_retail, 2),
            "low_stock_count": len(low_stock_items),
            "low_stock_items": low_stock_items[:10],
            "stock_map": stock_map,
            "products": products,
        }

    async def get_financial_metrics(
        self, db: AsyncSession, organization_id: UUID
    ) -> Dict[str, Any]:
        stmt = select(Invoice).where(
            Invoice.organization_id == organization_id,
            Invoice.status != "VOID",
        )
        res = await db.execute(stmt)
        invoices = res.scalars().all()

        total_invoiced = 0.0
        total_collected = 0.0
        total_outstanding = 0.0
        paid_count = 0
        pending_count = 0
        overdue_count = 0

        for inv in invoices:
            total_invoiced += inv.total_amount
            total_collected += inv.paid_amount
            total_outstanding += inv.balance_due
            if inv.status == "PAID":
                paid_count += 1
            elif inv.status in ("ISSUED", "PARTIALLY_PAID"):
                pending_count += 1
            elif inv.status == "OVERDUE":
                overdue_count += 1

        collection_rate = (
            round((total_collected / total_invoiced * 100.0), 1)
            if total_invoiced > 0
            else 0.0
        )

        return {
            "total_invoiced": round(total_invoiced, 2),
            "total_collected": round(total_collected, 2),
            "total_outstanding": round(total_outstanding, 2),
            "collection_rate_pct": collection_rate,
            "invoices_count": len(invoices),
            "paid_invoices_count": paid_count,
            "pending_invoices_count": pending_count,
            "overdue_invoices_count": overdue_count,
        }

    async def get_order_metrics(
        self, db: AsyncSession, organization_id: UUID
    ) -> Dict[str, Any]:
        stmt = select(SalesOrder).where(SalesOrder.organization_id == organization_id)
        res = await db.execute(stmt)
        orders = res.scalars().all()

        draft_count = 0
        confirmed_count = 0
        fulfilled_count = 0
        cancelled_count = 0
        draft_val = 0.0
        confirmed_val = 0.0
        fulfilled_val = 0.0

        for o in orders:
            if o.status == "DRAFT":
                draft_count += 1
                draft_val += o.total_amount
            elif o.status == "CONFIRMED":
                confirmed_count += 1
                confirmed_val += o.total_amount
            elif o.status == "FULFILLED":
                fulfilled_count += 1
                fulfilled_val += o.total_amount
            elif o.status == "CANCELLED":
                cancelled_count += 1

        return {
            "total_orders": len(orders),
            "active_order_book_value": round(confirmed_val, 2),
            "draft_count": draft_count,
            "confirmed_count": confirmed_count,
            "fulfilled_count": fulfilled_count,
            "cancelled_count": cancelled_count,
            "draft_value": round(draft_val, 2),
            "confirmed_value": round(confirmed_val, 2),
            "fulfilled_value": round(fulfilled_val, 2),
        }

    async def get_logistics_metrics(
        self, db: AsyncSession, organization_id: UUID
    ) -> Dict[str, Any]:
        stmt = select(Shipment).where(Shipment.organization_id == organization_id)
        res = await db.execute(stmt)
        shipments = res.scalars().all()

        preparing = 0
        in_transit = 0
        delivered = 0
        cancelled = 0

        for s in shipments:
            if s.status in ("PREPARING", "PENDING"):
                preparing += 1
            elif s.status in ("DISPATCHED", "IN_TRANSIT", "OUT_FOR_DELIVERY"):
                in_transit += 1
            elif s.status == "DELIVERED":
                delivered += 1
            elif s.status == "CANCELLED":
                cancelled += 1

        return {
            "total_shipments": len(shipments),
            "in_transit_count": in_transit,
            "delivered_count": delivered,
            "preparing_count": preparing,
            "cancelled_count": cancelled,
        }

    async def get_purchasing_metrics(
        self, db: AsyncSession, organization_id: UUID
    ) -> Dict[str, Any]:
        stmt = select(PurchaseOrder).where(
            PurchaseOrder.organization_id == organization_id
        )
        res = await db.execute(stmt)
        pos = res.scalars().all()

        active_count = 0
        committed = 0.0

        for po in pos:
            if po.status in ("DRAFT", "ORDERED", "PARTIALLY_RECEIVED"):
                active_count += 1
                committed += po.total_amount

        return {
            "total_purchase_orders": len(pos),
            "active_po_count": active_count,
            "committed_spend": round(committed, 2),
        }

    async def get_top_selling_products(
        self,
        db: AsyncSession,
        organization_id: UUID,
        stock_map: Dict[UUID, int],
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        stmt = (
            select(
                Product.id,
                Product.name,
                Product.sku,
                func.coalesce(func.sum(OrderItem.quantity), 0).label("units_sold"),
                func.coalesce(func.sum(OrderItem.subtotal), 0.0).label("total_revenue"),
            )
            .join(OrderItem, OrderItem.product_id == Product.id)
            .join(SalesOrder, SalesOrder.id == OrderItem.order_id)
            .where(
                SalesOrder.organization_id == organization_id,
                SalesOrder.status != "CANCELLED",
            )
            .group_by(Product.id, Product.name, Product.sku)
            .order_by(desc("units_sold"))
            .limit(limit)
        )
        res = await db.execute(stmt)
        rows = res.all()

        top_products = []
        for row in rows:
            p_id, name, sku, units_sold, rev = row
            top_products.append({
                "product_id": p_id,
                "name": name,
                "sku": sku,
                "units_sold": int(units_sold),
                "total_revenue": round(float(rev), 2),
                "current_stock": stock_map.get(p_id, 0),
            })
        return top_products

    async def get_warehouse_distribution(
        self,
        db: AsyncSession,
        organization_id: UUID,
        products: List[Product],
    ) -> List[Dict[str, Any]]:
        # Fetch warehouses
        wh_stmt = (
            select(Warehouse)
            .where(Warehouse.organization_id == organization_id)
            .order_by(Warehouse.name)
        )
        wh_res = await db.execute(wh_stmt)
        warehouses = wh_res.scalars().all()

        # Product cost map
        cost_map = {p.id: (p.cost_price or 0.0) for p in products}

        # Query stock by warehouse and product
        wh_mov_stmt = (
            select(
                InventoryMovement.warehouse_id,
                InventoryMovement.product_id,
                func.coalesce(func.sum(InventoryMovement.quantity_change), 0).label("stock"),
            )
            .where(
                InventoryMovement.organization_id == organization_id,
                InventoryMovement.warehouse_id.isnot(None),
            )
            .group_by(InventoryMovement.warehouse_id, InventoryMovement.product_id)
        )
        wh_mov_res = await db.execute(wh_mov_stmt)
        wh_stock_rows = wh_mov_res.all()

        wh_totals: Dict[UUID, int] = {wh.id: 0 for wh in warehouses}
        wh_valuation: Dict[UUID, float] = {wh.id: 0.0 for wh in warehouses}

        for wh_id, prod_id, qty in wh_stock_rows:
            if wh_id in wh_totals:
                qty_int = int(qty)
                wh_totals[wh_id] += qty_int
                wh_valuation[wh_id] += qty_int * cost_map.get(prod_id, 0.0)

        total_wh_units = sum(max(0, u) for u in wh_totals.values())

        distribution = []
        for wh in warehouses:
            units = max(0, wh_totals.get(wh.id, 0))
            val = max(0.0, wh_valuation.get(wh.id, 0.0))
            pct = (
                round((units / total_wh_units * 100.0), 1)
                if total_wh_units > 0
                else 0.0
            )
            distribution.append({
                "warehouse_id": wh.id,
                "name": wh.name,
                "code": wh.code,
                "location": wh.location,
                "total_units": units,
                "cost_valuation": round(val, 2),
                "pct_of_total_stock": pct,
            })

        return distribution

    async def get_recent_activities(
        self, db: AsyncSession, organization_id: UUID, limit: int = 8
    ) -> List[Dict[str, Any]]:
        activities: List[Dict[str, Any]] = []

        # 1. Recent orders
        orders_stmt = (
            select(SalesOrder)
            .options(selectinload(SalesOrder.customer))
            .where(SalesOrder.organization_id == organization_id)
            .order_by(desc(SalesOrder.created_at))
            .limit(4)
        )
        orders_res = await db.execute(orders_stmt)
        for o in orders_res.scalars().all():
            cust_name = o.customer.name if o.customer else "Direct Customer"
            badge = "info" if o.status == "CONFIRMED" else ("success" if o.status == "FULFILLED" else "default")
            activities.append({
                "id": f"order-{o.id}",
                "activity_type": "ORDER",
                "title": f"Sales Order #{o.order_number}",
                "description": f"{cust_name} · Status: {o.status}",
                "amount": o.total_amount,
                "timestamp": o.created_at,
                "badge_variant": badge,
            })

        # 2. Recent payments
        payments_stmt = (
            select(Payment)
            .where(Payment.organization_id == organization_id)
            .order_by(desc(Payment.payment_date))
            .limit(4)
        )
        payments_res = await db.execute(payments_stmt)
        for pay in payments_res.scalars().all():
            activities.append({
                "id": f"payment-{pay.id}",
                "activity_type": "PAYMENT",
                "title": f"Payment #{pay.payment_number}",
                "description": f"Ref: {pay.reference} via {pay.payment_method}",
                "amount": pay.amount,
                "timestamp": pay.payment_date,
                "badge_variant": "success",
            })

        # 3. Recent shipments
        shipments_stmt = (
            select(Shipment)
            .where(Shipment.organization_id == organization_id)
            .order_by(desc(Shipment.created_at))
            .limit(4)
        )
        shipments_res = await db.execute(shipments_stmt)
        for shp in shipments_res.scalars().all():
            badge = "success" if shp.status == "DELIVERED" else "warning"
            activities.append({
                "id": f"shipment-{shp.id}",
                "activity_type": "SHIPMENT",
                "title": f"Shipment #{shp.tracking_number}",
                "description": f"Carrier: {shp.carrier} · Status: {shp.status}",
                "amount": None,
                "timestamp": shp.created_at,
                "badge_variant": badge,
            })

        # 4. Recent inventory movements
        mov_stmt = (
            select(InventoryMovement)
            .options(selectinload(InventoryMovement.product))
            .where(InventoryMovement.organization_id == organization_id)
            .order_by(desc(InventoryMovement.created_at))
            .limit(4)
        )
        mov_res = await db.execute(mov_stmt)
        for m in mov_res.scalars().all():
            p_name = m.product.name if m.product else "Item"
            sign = "+" if m.quantity_change > 0 else ""
            badge = "info" if m.quantity_change > 0 else "default"
            activities.append({
                "id": f"mov-{m.id}",
                "activity_type": "INVENTORY",
                "title": f"Inventory {m.movement_type}",
                "description": f"{p_name} ({sign}{m.quantity_change}) · Ref: {m.reference}",
                "amount": None,
                "timestamp": m.created_at,
                "badge_variant": badge,
            })

        # Sort all combined activities descending by timestamp
        activities.sort(key=lambda a: a["timestamp"], reverse=True)
        return activities[:limit]

    async def get_demand_forecast(
        self, db: AsyncSession, organization_id: UUID
    ) -> Dict[str, Any]:
        """Compute real-time sales velocity, days-of-inventory runway, and replenishment risks."""
        # 1. Fetch catalog products with categories
        prod_stmt = (
            select(Product)
            .options(selectinload(Product.category))
            .where(Product.organization_id == organization_id)
            .order_by(Product.name)
        )
        prod_res = await db.execute(prod_stmt)
        products = prod_res.scalars().all()

        # 2. On-hand stock levels from immutable ledger
        mov_stmt = (
            select(
                InventoryMovement.product_id,
                func.coalesce(func.sum(InventoryMovement.quantity_change), 0).label("stock"),
            )
            .where(InventoryMovement.organization_id == organization_id)
            .group_by(InventoryMovement.product_id)
        )
        mov_res = await db.execute(mov_stmt)
        stock_map = {row[0]: int(row[1]) for row in mov_res.all()}

        # 3. Reserved stock in confirmed sales orders
        res_stmt = (
            select(
                OrderItem.product_id,
                func.coalesce(func.sum(OrderItem.quantity), 0).label("reserved"),
            )
            .join(SalesOrder, SalesOrder.id == OrderItem.order_id)
            .where(
                SalesOrder.organization_id == organization_id,
                SalesOrder.status == "CONFIRMED",
            )
            .group_by(OrderItem.product_id)
        )
        res_res = await db.execute(res_stmt)
        reserved_map = {row[0]: int(row[1]) for row in res_res.all()}

        # 4. Outbound order demand velocity
        sold_stmt = (
            select(
                OrderItem.product_id,
                func.coalesce(func.sum(OrderItem.quantity), 0).label("units_sold"),
            )
            .join(SalesOrder, SalesOrder.id == OrderItem.order_id)
            .where(
                SalesOrder.organization_id == organization_id,
                SalesOrder.status != "CANCELLED",
            )
            .group_by(OrderItem.product_id)
        )
        sold_res = await db.execute(sold_stmt)
        sold_map = {row[0]: int(row[1]) for row in sold_res.all()}

        # 5. Organization suppliers
        sup_stmt = (
            select(Supplier)
            .where(Supplier.organization_id == organization_id)
            .order_by(Supplier.name)
        )
        sup_res = await db.execute(sup_stmt)
        suppliers = sup_res.scalars().all()
        default_supplier = suppliers[0] if suppliers else None
        supplier_by_id = {s.id: s for s in suppliers}

        # PO item mapping to associate preferred supplier per product
        po_item_stmt = (
            select(PurchaseOrderItem.product_id, PurchaseOrder.supplier_id)
            .join(PurchaseOrder, PurchaseOrder.id == PurchaseOrderItem.purchase_order_id)
            .where(PurchaseOrder.organization_id == organization_id)
        )
        po_item_res = await db.execute(po_item_stmt)
        product_supplier_map = {row[0]: row[1] for row in po_item_res.all()}

        forecast_items = []
        critical_count = 0
        warning_count = 0
        healthy_count = 0
        overstocked_count = 0
        total_reorder_cost = 0.0
        total_days_sum = 0.0
        valid_days_count = 0

        today = date.today()

        for p in products:
            on_hand = max(0, stock_map.get(p.id, 0))
            reserved = max(0, reserved_map.get(p.id, 0))
            available = max(0, on_hand - reserved)

            # Daily sales velocity (units / day)
            units_sold = sold_map.get(p.id, 0)
            if units_sold > 0:
                daily_velocity = round(max(0.2, units_sold / 14.0), 2)
            else:
                ref_point = p.reorder_point if p.reorder_point and p.reorder_point > 0 else 10
                daily_velocity = round(max(0.1, ref_point / 15.0), 2)

            # Days of inventory remaining (Runway / DOH)
            if daily_velocity > 0:
                days_left = round(available / daily_velocity, 1)
            else:
                days_left = 999.0

            # Supplier lead time and dynamic ROP calculation
            supplier_id = product_supplier_map.get(p.id) or (default_supplier.id if default_supplier else None)
            supplier_obj = supplier_by_id.get(supplier_id) if supplier_id else default_supplier
            lead_time = 7  # 7-day average turnaround
            safety_buffer = max(5, int(daily_velocity * 4))
            dynamic_rop = int((daily_velocity * lead_time) + safety_buffer)
            effective_rop = max(p.reorder_point or 0, dynamic_rop)

            # Risk classification
            if days_left <= 7.0 or available <= (effective_rop // 2):
                risk = "CRITICAL"
                critical_count += 1
            elif days_left <= 15.0 or available <= effective_rop:
                risk = "WARNING"
                warning_count += 1
            elif days_left <= 45.0:
                risk = "HEALTHY"
                healthy_count += 1
            else:
                risk = "OVERSTOCKED"
                overstocked_count += 1

            if days_left < 365:
                total_days_sum += days_left
                valid_days_count += 1

            # Suggested replenishment quantity (to replenish to 30-day runway)
            if risk in ("CRITICAL", "WARNING"):
                target_30d = int(math.ceil(30 * daily_velocity))
                suggested_qty = max(10, target_30d - available)
            else:
                suggested_qty = 0

            cost_price = p.cost_price or p.price or 0.0
            reorder_cost = round(suggested_qty * cost_price, 2)
            total_reorder_cost += reorder_cost

            # Stockout date estimate
            if days_left < 180:
                est_date = (today + timedelta(days=int(days_left))).isoformat()
            else:
                est_date = None

            forecast_items.append({
                "product_id": p.id,
                "name": p.name,
                "sku": p.sku,
                "category_name": p.category.name if p.category else None,
                "current_stock": on_hand,
                "reserved_stock": reserved,
                "available_stock": available,
                "daily_velocity": daily_velocity,
                "days_of_inventory": days_left if days_left < 365 else None,
                "stockout_risk": risk,
                "reorder_point": effective_rop,
                "suggested_reorder_qty": suggested_qty,
                "supplier_lead_time_days": lead_time,
                "estimated_stockout_date": est_date,
                "primary_supplier_id": supplier_obj.id if supplier_obj else None,
                "primary_supplier_name": supplier_obj.name if supplier_obj else None,
                "unit_cost": cost_price,
                "projected_reorder_cost": reorder_cost,
            })

        # Sort: CRITICAL first, then WARNING, then by days_of_inventory ascending
        risk_priority = {"CRITICAL": 0, "WARNING": 1, "HEALTHY": 2, "OVERSTOCKED": 3}
        forecast_items.sort(
            key=lambda x: (
                risk_priority.get(x["stockout_risk"], 9),
                x["days_of_inventory"] if x["days_of_inventory"] is not None else 9999,
            )
        )

        avg_days = round(total_days_sum / valid_days_count, 1) if valid_days_count > 0 else 0.0

        return {
            "critical_count": critical_count,
            "warning_count": warning_count,
            "healthy_count": healthy_count,
            "overstocked_count": overstocked_count,
            "avg_days_of_inventory": avg_days,
            "total_reorder_capital_required": round(total_reorder_cost, 2),
            "items": forecast_items,
        }


analytics_repo = AnalyticsRepository()
