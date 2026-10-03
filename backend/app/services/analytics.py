"""Dashboard and Analytics Business Logic Service."""
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.organization import organization_repo
from app.repositories.analytics import analytics_repo
from app.schemas.analytics import (
    DashboardSummaryResponse,
    InventoryValuationMetrics,
    LowStockAlertItem,
    FinancialRevenueMetrics,
    OrderPipelineMetrics,
    LogisticsMetrics,
    PurchasingPipelineMetrics,
    TopSellingProduct,
    WarehouseStockDistribution,
    RecentActivityItem,
    DemandForecastSummary,
    DemandForecastItem,
    AutoDraftPORequest,
    AutoDraftPOResponse,
)


class AnalyticsService:
    """Service compiling executive dashboard metrics backed by real business queries."""

    async def get_dashboard_summary(
        self, db: AsyncSession, organization_id: UUID
    ) -> DashboardSummaryResponse:
        org = await organization_repo.get(db, id=organization_id)
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization context not found.",
            )

        # 1. Inventory & Valuation
        inv_data = await analytics_repo.get_inventory_metrics(db, organization_id=organization_id)
        inventory_metrics = InventoryValuationMetrics(
            total_skus=inv_data["total_skus"],
            total_units_on_hand=inv_data["total_units_on_hand"],
            total_cost_valuation=inv_data["total_cost_valuation"],
            total_retail_valuation=inv_data["total_retail_valuation"],
            low_stock_count=inv_data["low_stock_count"],
            low_stock_items=[
                LowStockAlertItem(**item) for item in inv_data["low_stock_items"]
            ],
        )

        # 2. Financials & Receivables
        fin_data = await analytics_repo.get_financial_metrics(db, organization_id=organization_id)
        financial_metrics = FinancialRevenueMetrics(**fin_data)

        # 3. Sales Order Pipeline
        order_data = await analytics_repo.get_order_metrics(db, organization_id=organization_id)
        order_metrics = OrderPipelineMetrics(**order_data)

        # 4. Logistics & Shipments
        logistics_data = await analytics_repo.get_logistics_metrics(db, organization_id=organization_id)
        logistics_metrics = LogisticsMetrics(**logistics_data)

        # 5. Purchasing & Supplier Pipeline
        purchasing_data = await analytics_repo.get_purchasing_metrics(db, organization_id=organization_id)
        purchasing_metrics = PurchasingPipelineMetrics(**purchasing_data)

        # 6. Top Selling SKUs
        top_selling_raw = await analytics_repo.get_top_selling_products(
            db,
            organization_id=organization_id,
            stock_map=inv_data["stock_map"],
            limit=5,
        )
        top_products = [TopSellingProduct(**tp) for tp in top_selling_raw]

        # 7. Warehouse Capacity & Distribution
        wh_dist_raw = await analytics_repo.get_warehouse_distribution(
            db,
            organization_id=organization_id,
            products=inv_data["products"],
        )
        warehouse_distribution = [
            WarehouseStockDistribution(**wd) for wd in wh_dist_raw
        ]

        # 8. Unified Recent Activity Feed
        recent_raw = await analytics_repo.get_recent_activities(
            db, organization_id=organization_id, limit=8
        )
        recent_activities = [RecentActivityItem(**ra) for ra in recent_raw]

        return DashboardSummaryResponse(
            organization_name=org.name,
            currency=org.currency or "INR",
            inventory=inventory_metrics,
            financials=financial_metrics,
            orders=order_metrics,
            logistics=logistics_metrics,
            purchasing=purchasing_metrics,
            top_products=top_products,
            warehouses=warehouse_distribution,
            recent_activities=recent_activities,
        )

    async def get_demand_forecast(
        self, db: AsyncSession, organization_id: UUID
    ) -> DemandForecastSummary:
        """Compute real-time sales velocity, days-of-inventory runway, and replenishment risks."""
        raw_forecast = await analytics_repo.get_demand_forecast(
            db, organization_id=organization_id
        )
        return DemandForecastSummary(
            critical_count=raw_forecast["critical_count"],
            warning_count=raw_forecast["warning_count"],
            healthy_count=raw_forecast["healthy_count"],
            overstocked_count=raw_forecast["overstocked_count"],
            avg_days_of_inventory=raw_forecast["avg_days_of_inventory"],
            total_reorder_capital_required=raw_forecast["total_reorder_capital_required"],
            items=[DemandForecastItem(**item) for item in raw_forecast["items"]],
        )

    async def auto_draft_po(
        self,
        db: AsyncSession,
        organization_id: UUID,
        obj_in: AutoDraftPORequest,
    ) -> AutoDraftPOResponse:
        """1-click automated purchase order draft generator for depleted SKUs."""
        from sqlalchemy import select
        from app.models.catalog import Product
        from app.models.supplier import Supplier
        from app.repositories.warehouse import warehouse_repo
        from app.services.purchase_order import purchase_order_service
        from app.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderItemCreate

        # 1. Fetch product
        prod_stmt = select(Product).where(
            Product.id == obj_in.product_id,
            Product.organization_id == organization_id,
        )
        prod_res = await db.execute(prod_stmt)
        product = prod_res.scalar_one_or_none()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found in organization catalog.",
            )

        # 2. Determine quantity
        quantity = obj_in.quantity
        if not quantity or quantity <= 0:
            forecast_data = await analytics_repo.get_demand_forecast(
                db, organization_id=organization_id
            )
            match = next(
                (item for item in forecast_data["items"] if item["product_id"] == product.id),
                None,
            )
            quantity = match["suggested_reorder_qty"] if match and match["suggested_reorder_qty"] > 0 else 25

        # 3. Determine warehouse
        warehouse_id = obj_in.warehouse_id
        if not warehouse_id:
            default_wh = await warehouse_repo.get_default(db, organization_id=organization_id)
            if not default_wh:
                whs = await warehouse_repo.list_by_organization(db, organization_id=organization_id)
                default_wh = whs[0] if whs else None
            if not default_wh:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No warehouse facility available to receive inventory.",
                )
            warehouse_id = default_wh.id

        # 4. Determine supplier
        supplier_id = obj_in.supplier_id
        if not supplier_id:
            sup_stmt = (
                select(Supplier)
                .where(Supplier.organization_id == organization_id)
                .order_by(Supplier.name)
            )
            sup_res = await db.execute(sup_stmt)
            sup = sup_res.scalars().first()
            if not sup:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No active supplier found in organization directory.",
                )
            supplier_id = sup.id
        else:
            sup = await db.get(Supplier, supplier_id)
            if not sup or sup.organization_id != organization_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Selected supplier not found.",
                )

        # 5. Create Draft Purchase Order
        unit_cost = product.cost_price or product.price or 0.0
        po_create = PurchaseOrderCreate(
            supplier_id=supplier_id,
            destination_warehouse_id=warehouse_id,
            notes=f"Auto-generated replenishment draft by FlowStock Demand Forecasting Engine for {product.name} ({product.sku}).",
            items=[
                PurchaseOrderItemCreate(
                    product_id=product.id,
                    quantity=quantity,
                    unit_cost=unit_cost,
                )
            ],
        )
        created_po = await purchase_order_service.create_po(
            db, organization_id=organization_id, obj_in=po_create
        )

        return AutoDraftPOResponse(
            po_id=created_po.id,
            po_number=created_po.po_number,
            supplier_name=sup.name if sup else "Primary Supplier",
            product_name=product.name,
            quantity=quantity,
            unit_cost=unit_cost,
            total_cost=round(quantity * unit_cost, 2),
            status=created_po.status,
            message=f"Successfully drafted Purchase Order #{created_po.po_number} for {quantity} units with {sup.name}.",
        )


analytics_service = AnalyticsService()
