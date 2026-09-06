import {
  HealthResponse,
  Organization,
  User,
  Category,
  Product,
  ProductStockSummary,
  InventoryMovement,
  Warehouse,
  StockTransfer,
  Customer,
  OrderItem,
  SalesOrder,
  Supplier,
  PurchaseOrderItem,
  PurchaseOrder,
  Shipment,
  ShipmentEvent,
  ShipmentCreatePayload,
  ShipmentStatusUpdatePayload,
  Invoice,
  InvoiceItem,
  Payment,
  InvoiceCreatePayload,
  PaymentCreatePayload,
  DashboardSummaryResponse,
  NotificationItem,
  AuditLog,
  JobExecution,
  AvailableJob,
  JobTriggerResponse,
} from "@/types/api";

const API_BASE_URL = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) || (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_API_URL) || "http://localhost:8000/api/v1";


interface CacheEntry {
  data: any;
  timestamp: number;
}
const apiCache = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 60000; // 60s in-memory cache for instant navigation

export function clearApiCache(keyPrefix?: string) {
  if (!keyPrefix) {
    apiCache.clear();
    return;
  }
  for (const k of Array.from(apiCache.keys())) {
    if (k.includes(keyPrefix)) {
      apiCache.delete(k);
    }
  }
}

async function cachedGet<T>(url: string, ttlMs = DEFAULT_TTL_MS): Promise<T> {
  const orgId = typeof window !== "undefined" ? localStorage.getItem("flowstock_org_id") || "" : "";
  const key = `${orgId}:${url}`;
  const now = Date.now();
  const cached = apiCache.get(key);
  if (cached && (now - cached.timestamp < ttlMs)) {
    return cached.data as T;
  }
  const res = await fetch(url, {
    cache: "no-store",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  apiCache.set(key, { data, timestamp: now });
  return data;
}

function getHeaders(extraHeaders: Record<string, string> = {}): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  if (typeof window !== "undefined") {
    const orgId = localStorage.getItem("flowstock_org_id");
    if (orgId) {
      headers["X-Organization-Id"] = orgId;
    }
    const userId = localStorage.getItem("flowstock_user_id");
    if (userId) {
      headers["X-User-Id"] = userId;
    }
  }
  return headers;
}

export async function fetchHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      cache: "no-store",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    return {
      status: "unhealthy",
      app: "FlowStock",
      environment: "unknown",
      version: "0.1.0",
      database: {
        status: "disconnected",
        connected: false,
        engine: "none",
        url: "none",
        error: error instanceof Error ? error.message : "Failed to reach backend",
      },
      cache: { status: "unknown", provider: "none" },
    };
  }
}

export async function fetchOrganizations(): Promise<Organization[]> {
  return cachedGet<Organization[]>(`${API_BASE_URL}/organizations`);
}

export interface CreateOrgUserPayload {
  name: string;
  email: string;
  role: string;
}

export async function createOrgUserApi(orgId: string, data: CreateOrgUserPayload): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/organizations/${orgId}/users`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to provision user");
  }
  return await res.json();
}

clearApiCache();
  export async function createOrganizationApi(data: {
  name: string;
  slug: string;
  currency: string;
}): Promise<Organization> {
  const res = await fetch(`${API_BASE_URL}/organizations`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create organization");
  }
  return await res.json();
}

export async function deleteOrganizationApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/organizations/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to delete organization");
  }
  clearApiCache();
}

export async function fetchCategories(): Promise<Category[]> {
  return cachedGet<Category[]>(`${API_BASE_URL}/categories`);
}

clearApiCache();
  export async function createCategoryApi(data: {
  name: string;
  description?: string;
}): Promise<Category> {
  const res = await fetch(`${API_BASE_URL}/categories`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create category");
  }
  return await res.json();
}

export async function fetchProducts(params: {
  search?: string;
  category_id?: string;
} = {}): Promise<Product[]> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category_id) query.set("category_id", params.category_id);

  const url = `${API_BASE_URL}/products${query.toString() ? `?${query.toString()}` : ""}`;
  return cachedGet<Product[]>(url);
}

clearApiCache();
  export async function createProductApi(data: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create product");
  }
  return await res.json();
}

clearApiCache();
  export async function updateProductApi(id: string, data: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update product");
  }
  return await res.json();
}

clearApiCache();
  export async function deleteProductApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

// --- Inventory ---
export async function fetchInventorySummaries(): Promise<ProductStockSummary[]> {
  const res = await fetch(`${API_BASE_URL}/inventory`, {
    cache: "no-store",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

clearApiCache();
  export async function recordMovementApi(data: {
  product_id: string;
  movement_type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  reference: string;
  notes?: string;
}): Promise<InventoryMovement> {
  const res = await fetch(`${API_BASE_URL}/inventory/movements`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to record inventory movement");
  }
  return await res.json();
}

export async function fetchProductMovements(productId: string): Promise<InventoryMovement[]> {
  const res = await fetch(`${API_BASE_URL}/inventory/${productId}/movements`, {
    cache: "no-store",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

// --- Warehouses & Transfers ---
export async function fetchWarehouses(): Promise<Warehouse[]> {
  return cachedGet<Warehouse[]>(`${API_BASE_URL}/warehouses`);
}

clearApiCache();
  export async function createWarehouseApi(data: {
  name: string;
  code: string;
  location?: string;
  is_default?: boolean;
}): Promise<Warehouse> {
  const res = await fetch(`${API_BASE_URL}/warehouses`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create warehouse");
  }
  return await res.json();
}

export async function fetchTransfers(params: {
  status?: string;
  warehouse_id?: string;
} = {}): Promise<StockTransfer[]> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.warehouse_id) query.set("warehouse_id", params.warehouse_id);

  const url = `${API_BASE_URL}/transfers${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

clearApiCache();
  export async function createTransferApi(data: {
  source_warehouse_id: string;
  destination_warehouse_id: string;
  product_id: string;
  quantity: number;
  notes?: string;
}): Promise<StockTransfer> {
  const res = await fetch(`${API_BASE_URL}/transfers`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create transfer");
  }
  return await res.json();
}

clearApiCache();
  export async function dispatchTransferApi(id: string): Promise<StockTransfer> {
  const res = await fetch(`${API_BASE_URL}/transfers/${id}/dispatch`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to dispatch transfer");
  }
  return await res.json();
}

clearApiCache();
  export async function receiveTransferApi(id: string): Promise<StockTransfer> {
  const res = await fetch(`${API_BASE_URL}/transfers/${id}/receive`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to receive transfer");
  }
  return await res.json();
}

export async function cancelTransferApi(id: string): Promise<StockTransfer> {
  const res = await fetch(`${API_BASE_URL}/transfers/${id}/cancel`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to cancel transfer");
  }
  return await res.json();
}

// --- Customers ---
export async function fetchCustomers(search?: string): Promise<Customer[]> {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  const url = `${API_BASE_URL}/customers${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

clearApiCache();
  export async function createCustomerApi(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  billing_address?: string;
  shipping_address?: string;
}): Promise<Customer> {
  const res = await fetch(`${API_BASE_URL}/customers`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create customer");
  }
  return await res.json();
}

// --- Sales Orders ---
export async function fetchOrders(params: {
  status?: string;
  customer_id?: string;
} = {}): Promise<SalesOrder[]> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.customer_id) query.set("customer_id", params.customer_id);

  const url = `${API_BASE_URL}/orders${query.toString() ? `?${query.toString()}` : ""}`;
  return cachedGet<SalesOrder[]>(url);
}

clearApiCache();
  export async function createOrderApi(data: {
  customer_id: string;
  warehouse_id?: string;
  notes?: string;
  items: { product_id: string; quantity: number; unit_price?: number }[];
}): Promise<SalesOrder> {
  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create order");
  }
  return await res.json();
}

clearApiCache();
  export async function confirmOrderApi(id: string): Promise<SalesOrder> {
  const res = await fetch(`${API_BASE_URL}/orders/${id}/confirm`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to confirm order");
  }
  return await res.json();
}

clearApiCache();
  export async function fulfillOrderApi(id: string): Promise<SalesOrder> {
  const res = await fetch(`${API_BASE_URL}/orders/${id}/fulfill`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fulfill order");
  }
  return await res.json();
}

clearApiCache();
  export async function cancelOrderApi(id: string): Promise<SalesOrder> {
  const res = await fetch(`${API_BASE_URL}/orders/${id}/cancel`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to cancel order");
  }
  return await res.json();
}

// --- Suppliers ---
export async function fetchSuppliers(search?: string): Promise<Supplier[]> {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  const url = `${API_BASE_URL}/suppliers${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

clearApiCache();
  export async function createSupplierApi(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  payment_terms?: string;
}): Promise<Supplier> {
  const res = await fetch(`${API_BASE_URL}/suppliers`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create supplier");
  }
  return await res.json();
}

// --- Purchase Orders ---
export async function fetchPurchaseOrders(params: {
  status?: string;
  supplier_id?: string;
} = {}): Promise<PurchaseOrder[]> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.supplier_id) query.set("supplier_id", params.supplier_id);

  const url = `${API_BASE_URL}/purchase-orders${query.toString() ? `?${query.toString()}` : ""}`;
  return cachedGet<PurchaseOrder[]>(url);
}

clearApiCache();
  export async function createPurchaseOrderApi(data: {
  supplier_id: string;
  destination_warehouse_id: string;
  notes?: string;
  items: { product_id: string; quantity: number; unit_cost?: number }[];
}): Promise<PurchaseOrder> {
  const res = await fetch(`${API_BASE_URL}/purchase-orders`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create purchase order");
  }
  return await res.json();
}

clearApiCache();
  export async function issuePurchaseOrderApi(id: string): Promise<PurchaseOrder> {
  const res = await fetch(`${API_BASE_URL}/purchase-orders/${id}/issue`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to issue purchase order");
  }
  return await res.json();
}

clearApiCache();
  export async function receivePurchaseOrderApi(id: string): Promise<PurchaseOrder> {
  const res = await fetch(`${API_BASE_URL}/purchase-orders/${id}/receive`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to receive purchase order");
  }
  return await res.json();
}

clearApiCache();
  export async function cancelPurchaseOrderApi(id: string): Promise<PurchaseOrder> {
  const res = await fetch(`${API_BASE_URL}/purchase-orders/${id}/cancel`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to cancel purchase order");
  }
  return await res.json();
}

// --- Shipments & Logistics Tracking ---
export async function fetchShipments(params: {
  status?: string;
  order_id?: string;
} = {}): Promise<Shipment[]> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.order_id) query.set("order_id", params.order_id);

  const url = `${API_BASE_URL}/shipments${query.toString() ? `?${query.toString()}` : ""}`;
  return cachedGet<Shipment[]>(url);
}

export async function fetchShipmentById(id: string): Promise<Shipment> {
  const res = await fetch(`${API_BASE_URL}/shipments/${id}`, {
    cache: "no-store",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

clearApiCache();
  export async function createShipmentApi(data: ShipmentCreatePayload): Promise<Shipment> {
  const res = await fetch(`${API_BASE_URL}/shipments`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create shipment");
  }
  return await res.json();
}

clearApiCache();
  export async function dispatchShipmentApi(
  id: string,
  data?: ShipmentStatusUpdatePayload
): Promise<Shipment> {
  const res = await fetch(`${API_BASE_URL}/shipments/${id}/dispatch`, {
    method: "POST",
    headers: getHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to dispatch shipment");
  }
  return await res.json();
}

clearApiCache();
  export async function outForDeliveryShipmentApi(
  id: string,
  data?: ShipmentStatusUpdatePayload
): Promise<Shipment> {
  const res = await fetch(`${API_BASE_URL}/shipments/${id}/out-for-delivery`, {
    method: "POST",
    headers: getHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to mark shipment out for delivery");
  }
  return await res.json();
}

clearApiCache();
  export async function deliverShipmentApi(
  id: string,
  data?: ShipmentStatusUpdatePayload
): Promise<Shipment> {
  const res = await fetch(`${API_BASE_URL}/shipments/${id}/deliver`, {
    method: "POST",
    headers: getHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to mark shipment delivered");
  }
  return await res.json();
}

clearApiCache();
  export async function cancelShipmentApi(
  id: string,
  data?: ShipmentStatusUpdatePayload
): Promise<Shipment> {
  const res = await fetch(`${API_BASE_URL}/shipments/${id}/cancel`, {
    method: "POST",
    headers: getHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to cancel shipment");
  }
  return await res.json();
}

export async function addShipmentEventApi(
  id: string,
  data: { status: string; location: string; description: string }
): Promise<ShipmentEvent> {
  const res = await fetch(`${API_BASE_URL}/shipments/${id}/events`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to add tracking event");
  }
  return await res.json();
}

// --- Invoices & Payments ---
export async function fetchInvoices(params: {
  status?: string;
  customer_id?: string;
} = {}): Promise<Invoice[]> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.customer_id) query.set("customer_id", params.customer_id);

  const url = `${API_BASE_URL}/invoices${query.toString() ? `?${query.toString()}` : ""}`;
  return cachedGet<Invoice[]>(url);
}

export async function fetchInvoiceById(id: string): Promise<Invoice> {
  const res = await fetch(`${API_BASE_URL}/invoices/${id}`, {
    cache: "no-store",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

clearApiCache();
  export async function createInvoiceApi(data: InvoiceCreatePayload): Promise<Invoice> {
  const res = await fetch(`${API_BASE_URL}/invoices`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create invoice");
  }
  return await res.json();
}

export async function createInvoiceFromOrderApi(
  orderId: string,
  taxRate: number = 18.0
): Promise<Invoice> {
  const res = await fetch(`${API_BASE_URL}/invoices/from-order/${orderId}?tax_rate=${taxRate}`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate invoice from order");
  }
  return await res.json();
}

clearApiCache();
  export async function issueInvoiceApi(id: string): Promise<Invoice> {
  const res = await fetch(`${API_BASE_URL}/invoices/${id}/issue`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to issue invoice");
  }
  return await res.json();
}

clearApiCache();
  export async function voidInvoiceApi(id: string): Promise<Invoice> {
  const res = await fetch(`${API_BASE_URL}/invoices/${id}/void`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to void invoice");
  }
  return await res.json();
}

export async function fetchPayments(params: {
  invoice_id?: string;
} = {}): Promise<Payment[]> {
  const query = new URLSearchParams();
  if (params.invoice_id) query.set("invoice_id", params.invoice_id);

  const url = `${API_BASE_URL}/payments${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

clearApiCache();
  export async function recordPaymentApi(data: PaymentCreatePayload): Promise<Invoice> {
  const res = await fetch(`${API_BASE_URL}/payments`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to record payment");
  }
  return await res.json();
}

export async function fetchDashboardSummary(): Promise<DashboardSummaryResponse> {
  const res = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
    cache: "no-store",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to load dashboard metrics");
  }
  return await res.json();
}

export async function fetchNotifications(params: {
  unread_only?: boolean;
  limit?: number;
} = {}): Promise<NotificationItem[]> {
  const query = new URLSearchParams();
  if (params.unread_only) query.set("unread_only", "true");
  if (params.limit) query.set("limit", params.limit.toString());

  const url = `${API_BASE_URL}/notifications${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      cache: "no-store",
      headers: getHeaders(),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.unread_count || 0;
  } catch {
    return 0;
  }
}

export async function markNotificationRead(id: string): Promise<NotificationItem> {
  const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to mark notification as read");
  }
  return await res.json();
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to mark all as read");
  }
}

export async function fetchAuditLogs(params: {
  entity_type?: string;
  action?: string;
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<AuditLog[]> {
  const query = new URLSearchParams();
  if (params.entity_type) query.set("entity_type", params.entity_type);
  if (params.action) query.set("action", params.action);
  if (params.search) query.set("search", params.search);
  if (params.limit) query.set("limit", params.limit.toString());
  if (params.offset) query.set("offset", params.offset.toString());

  const url = `${API_BASE_URL}/audit${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

// --- Background Jobs & Automation ---
export async function fetchAvailableJobs(): Promise<AvailableJob[]> {
  const res = await fetch(`${API_BASE_URL}/jobs/available`, {
    cache: "no-store",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function fetchJobExecutions(limit: number = 20): Promise<JobExecution[]> {
  const res = await fetch(`${API_BASE_URL}/jobs?limit=${limit}`, {
    cache: "no-store",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function triggerJobApi(jobName: string): Promise<JobTriggerResponse> {
  const res = await fetch(`${API_BASE_URL}/jobs/${jobName}/run`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to trigger job ${jobName}`);
  }
  return await res.json();
}
