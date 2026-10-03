"""Pydantic schemas for Dashboard and Operational Analytics."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class LowStockAlertItem(BaseModel):
    """Product SKU at or below its reorder safety threshold."""
    product_id: UUID
    name: str
    sku: str
    unit: str
    current_stock: int
    reorder_point: int

    model_config = ConfigDict(from_attributes=True)


class InventoryValuationMetrics(BaseModel):
    """Working capital, volume, and inventory health metrics."""
    total_skus: int
    total_units_on_hand: int
    total_cost_valuation: float
    total_retail_valuation: float
    low_stock_count: int
    low_stock_items: List[LowStockAlertItem]

    model_config = ConfigDict(from_attributes=True)


class FinancialRevenueMetrics(BaseModel):
    """Invoicing, cash collection, and accounts receivable metrics."""
    total_invoiced: float
    total_collected: float
    total_outstanding: float
    collection_rate_pct: float
    invoices_count: int
    paid_invoices_count: int
    pending_invoices_count: int
    overdue_invoices_count: int

    model_config = ConfigDict(from_attributes=True)


class OrderPipelineMetrics(BaseModel):
    """Sales orders distribution and fulfillment pipeline."""
    total_orders: int
    active_order_book_value: float
    draft_count: int
    confirmed_count: int
    fulfilled_count: int
    cancelled_count: int
    draft_value: float
    confirmed_value: float
    fulfilled_value: float

    model_config = ConfigDict(from_attributes=True)


class LogisticsMetrics(BaseModel):
    """Shipment dispatch and delivery tracking metrics."""
    total_shipments: int
    in_transit_count: int
    delivered_count: int
    preparing_count: int
    cancelled_count: int

    model_config = ConfigDict(from_attributes=True)


class PurchasingPipelineMetrics(BaseModel):
    """Supplier purchase orders and committed inbound spend."""
    total_purchase_orders: int
    active_po_count: int
    committed_spend: float

    model_config = ConfigDict(from_attributes=True)


class TopSellingProduct(BaseModel):
    """Fast-moving product ranked by sales volume and revenue."""
    product_id: UUID
    name: str
    sku: str
    units_sold: int
    total_revenue: float
    current_stock: int

    model_config = ConfigDict(from_attributes=True)


class WarehouseStockDistribution(BaseModel):
    """Distribution of stock units and inventory valuation across facilities."""
    warehouse_id: UUID
    name: str
    code: str
    location: Optional[str] = None
    total_units: int
    cost_valuation: float
    pct_of_total_stock: float

    model_config = ConfigDict(from_attributes=True)


class RecentActivityItem(BaseModel):
    """Unified operational activity feed entry."""
    id: str
    activity_type: str  # "ORDER", "PAYMENT", "SHIPMENT", "INVENTORY"
    title: str
    description: str
    amount: Optional[float] = None
    timestamp: datetime
    badge_variant: str  # "default", "success", "warning", "info", "danger"

    model_config = ConfigDict(from_attributes=True)


class DashboardSummaryResponse(BaseModel):
    """Comprehensive executive dashboard response backing every widget with real queries."""
    organization_name: str
    currency: str
    inventory: InventoryValuationMetrics
    financials: FinancialRevenueMetrics
    orders: OrderPipelineMetrics
    logistics: LogisticsMetrics
    purchasing: PurchasingPipelineMetrics
    top_products: List[TopSellingProduct]
    warehouses: List[WarehouseStockDistribution]
    recent_activities: List[RecentActivityItem]

    model_config = ConfigDict(from_attributes=True)


class DemandForecastItem(BaseModel):
    """Predictive telemetry and replenishment runway for an individual SKU."""
    product_id: UUID
    name: str
    sku: str
    category_name: Optional[str] = None
    current_stock: int
    reserved_stock: int
    available_stock: int
    daily_velocity: float
    days_of_inventory: Optional[float] = None
    stockout_risk: str  # "CRITICAL", "WARNING", "HEALTHY", "OVERSTOCKED"
    reorder_point: int
    suggested_reorder_qty: int
    supplier_lead_time_days: int
    estimated_stockout_date: Optional[str] = None
    primary_supplier_id: Optional[UUID] = None
    primary_supplier_name: Optional[str] = None
    unit_cost: float
    projected_reorder_cost: float

    model_config = ConfigDict(from_attributes=True)


class DemandForecastSummary(BaseModel):
    """Executive roll-up of algorithmic demand forecasting across all inventory."""
    critical_count: int
    warning_count: int
    healthy_count: int
    overstocked_count: int
    avg_days_of_inventory: float
    total_reorder_capital_required: float
    items: List[DemandForecastItem]

    model_config = ConfigDict(from_attributes=True)


class AutoDraftPORequest(BaseModel):
    """Payload to trigger 1-click automated purchase order draft."""
    product_id: UUID
    quantity: Optional[int] = None
    warehouse_id: Optional[UUID] = None
    supplier_id: Optional[UUID] = None


class AutoDraftPOResponse(BaseModel):
    """Result of auto-drafting a replenishment purchase order."""
    po_id: UUID
    po_number: str
    supplier_name: str
    product_name: str
    quantity: int
    unit_cost: float
    total_cost: float
    status: str
    message: str
