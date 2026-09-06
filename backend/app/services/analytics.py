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


analytics_service = AnalyticsService()
