export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  currency: string;
  created_at: string;
  updated_at: string;
  users: User[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  unit: string;
  price: number;
  cost_price: number;
  reorder_point: number;
  category_id?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: "IN" | "OUT" | "ADJUSTMENT";
  quantity_change: number;
  reference: string;
  notes?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProductStockSummary {
  product: Product;
  on_hand_quantity: number;
  reorder_point: number;
  is_low_stock: boolean;
  total_cost_value: number;
  total_retail_value: number;
}

export interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  app: string;
  environment: string;
  version: string;
  database: {
    status: string;
    connected: boolean;
    engine: string;
    url: string;
    error?: string;
  };
  cache: {
    status: string;
    provider: string;
  };
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location?: string;
  is_default: boolean;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface StockTransfer {
  id: string;
  transfer_number: string;
  source_warehouse_id: string;
  destination_warehouse_id: string;
  product_id: string;
  quantity: number;
  status: "REQUESTED" | "IN_TRANSIT" | "RECEIVED" | "CANCELLED";
  notes?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  source_warehouse?: Warehouse;
  destination_warehouse?: Warehouse;
  product?: Product;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  billing_address?: string;
  shipping_address?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  customer_id: string;
  warehouse_id?: string;
  status: "DRAFT" | "CONFIRMED" | "FULFILLED" | "CANCELLED";
  total_amount: number;
  notes?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  warehouse?: Warehouse;
  items: OrderItem[];
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  payment_terms?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  destination_warehouse_id: string;
  status: "DRAFT" | "ISSUED" | "RECEIVED" | "CANCELLED";
  total_amount: number;
  notes?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  destination_warehouse?: Warehouse;
  items: PurchaseOrderItem[];
}

export interface ShipmentEvent {
  id: string;
  shipment_id: string;
  status: string;
  location: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  organization_id: string;
  order_id: string;
  shipment_number: string;
  carrier: string;
  tracking_number: string;
  status: "PENDING" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
  shipping_cost: number;
  origin_address?: string;
  destination_address: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  order?: SalesOrder;
  events: ShipmentEvent[];
}

export interface ShipmentCreatePayload {
  order_id: string;
  carrier: string;
  tracking_number?: string;
  shipping_cost?: number;
  origin_address?: string;
  destination_address?: string;
  estimated_delivery?: string;
  notes?: string;
}

export interface ShipmentStatusUpdatePayload {
  location: string;
  description?: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface Payment {
  id: string;
  organization_id: string;
  invoice_id: string;
  payment_number: string;
  amount: number;
  payment_method: "BANK_TRANSFER" | "UPI" | "CHEQUE" | "NET_BANKING" | "CASH";
  reference: string;
  payment_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  organization_id: string;
  customer_id: string;
  order_id?: string;
  invoice_number: string;
  status: "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "VOID";
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  issue_date: string;
  due_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  order?: SalesOrder;
  items: InvoiceItem[];
  payments: Payment[];
}

export interface InvoiceCreatePayload {
  customer_id: string;
  order_id?: string;
  tax_rate?: number;
  issue_date?: string;
  due_date?: string;
  notes?: string;
  items: {
    description: string;
    quantity: number;
    unit_price: number;
    product_id?: string;
  }[];
}

export interface PaymentCreatePayload {
  invoice_id: string;
  amount: number;
  payment_method?: string;
  reference: string;
  notes?: string;
}

export interface LowStockAlertItem {
  product_id: string;
  name: string;
  sku: string;
  unit: string;
  current_stock: number;
  reorder_point: number;
}

export interface InventoryValuationMetrics {
  total_skus: number;
  total_units_on_hand: number;
  total_cost_valuation: number;
  total_retail_valuation: number;
  low_stock_count: number;
  low_stock_items: LowStockAlertItem[];
}

export interface FinancialRevenueMetrics {
  total_invoiced: number;
  total_collected: number;
  total_outstanding: number;
  collection_rate_pct: number;
  invoices_count: number;
  paid_invoices_count: number;
  pending_invoices_count: number;
  overdue_invoices_count: number;
}

export interface OrderPipelineMetrics {
  total_orders: number;
  active_order_book_value: number;
  draft_count: number;
  confirmed_count: number;
  fulfilled_count: number;
  cancelled_count: number;
  draft_value: number;
  confirmed_value: number;
  fulfilled_value: number;
}

export interface LogisticsMetrics {
  total_shipments: number;
  in_transit_count: number;
  delivered_count: number;
  preparing_count: number;
  cancelled_count: number;
}

export interface PurchasingPipelineMetrics {
  total_purchase_orders: number;
  active_po_count: number;
  committed_spend: number;
}

export interface TopSellingProduct {
  product_id: string;
  name: string;
  sku: string;
  units_sold: number;
  total_revenue: number;
  current_stock: number;
}

export interface WarehouseStockDistribution {
  warehouse_id: string;
  name: string;
  code: string;
  location?: string;
  total_units: number;
  cost_valuation: number;
  pct_of_total_stock: number;
}

export interface RecentActivityItem {
  id: string;
  activity_type: "ORDER" | "PAYMENT" | "SHIPMENT" | "INVENTORY";
  title: string;
  description: string;
  amount?: number | null;
  timestamp: string;
  badge_variant: "default" | "success" | "warning" | "info" | "danger";
}

export interface DashboardSummaryResponse {
  organization_name: string;
  currency: string;
  inventory: InventoryValuationMetrics;
  financials: FinancialRevenueMetrics;
  orders: OrderPipelineMetrics;
  logistics: LogisticsMetrics;
  purchasing: PurchasingPipelineMetrics;
  top_products: TopSellingProduct[];
  warehouses: WarehouseStockDistribution[];
  recent_activities: RecentActivityItem[];
}

export interface NotificationItem {
  id: string;
  organization_id: string;
  user_id?: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "DANGER";
  link?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
  updated_at: string;
}

export interface JobExecution {
  id: string;
  organization_id: string;
  job_name: string;
  status: "RUNNING" | "SUCCESS" | "FAILED";
  triggered_by: "MANUAL" | "SCHEDULE";
  started_at: string;
  completed_at?: string | null;
  duration_ms?: number | null;
  result_summary?: string | null;
  error_message?: string | null;
}

export interface AvailableJob {
  name: string;
  title: string;
  description: string;
  schedule_interval: string;
  last_run?: JobExecution | null;
}

export interface JobTriggerResponse {
  message: string;
  job_execution: JobExecution;
}
