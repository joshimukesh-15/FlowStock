const API_BASE_URL = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "http://localhost:8000/api/v1";
const apiCache = new Map();
const DEFAULT_TTL_MS = 60000; // 60s in-memory cache for instant navigation
export function clearApiCache(keyPrefix) {
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
async function cachedGet(url, ttlMs = DEFAULT_TTL_MS) {
    const orgId = typeof window !== "undefined" ? localStorage.getItem("flowstock_org_id") || "" : "";
    const key = `${orgId}:${url}`;
    const now = Date.now();
    const cached = apiCache.get(key);
    if (cached && (now - cached.timestamp < ttlMs)) {
        return cached.data;
    }
    const res = await fetch(url, {
        cache: "no-store",
        headers: getHeaders(),
        credentials: "include",
    });
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    apiCache.set(key, { data, timestamp: now });
    return data;
}
function getHeaders(extraHeaders = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...extraHeaders,
    };
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("flowstock_token");
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
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
export async function fetchHealth() {
    try {
        const res = await fetch(`${API_BASE_URL}/health`, {
            cache: "no-store",
            headers: getHeaders(),
        });
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        return await res.json();
    }
    catch (error) {
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
export async function fetchOrganizations() {
    return cachedGet(`${API_BASE_URL}/organizations`);
}
export async function createOrgUserApi(orgId, data) {
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
export async function createOrganizationApi(data) {
    const res = await fetch(`${API_BASE_URL}/organizations`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create organization");
    }
    clearApiCache();
    return await res.json();
}
export async function deleteOrganizationApi(id) {
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
export async function fetchCategories() {
    return cachedGet(`${API_BASE_URL}/categories`);
}
export async function createCategoryApi(data) {
    const res = await fetch(`${API_BASE_URL}/categories`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create category");
    }
    clearApiCache();
    return await res.json();
}
export async function fetchProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.search)
        query.set("search", params.search);
    if (params.category_id)
        query.set("category_id", params.category_id);
    const url = `${API_BASE_URL}/products${query.toString() ? `?${query.toString()}` : ""}`;
    return cachedGet(url);
}
export async function createProductApi(data) {
    const res = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create product");
    }
    clearApiCache();
    return await res.json();
}
export async function updateProductApi(id, data) {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update product");
    }
    clearApiCache();
    return await res.json();
}
export async function deleteProductApi(id) {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    clearApiCache();
}
// --- Inventory ---
export async function fetchInventorySummaries() {
    const res = await fetch(`${API_BASE_URL}/inventory`, {
        cache: "no-store",
        headers: getHeaders(),
    });
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    return await res.json();
}
export async function recordMovementApi(data) {
    const res = await fetch(`${API_BASE_URL}/inventory/movements`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to record inventory movement");
    }
    clearApiCache();
    return await res.json();
}
export async function fetchProductMovements(productId) {
    const res = await fetch(`${API_BASE_URL}/inventory/${productId}/movements`, {
        cache: "no-store",
        headers: getHeaders(),
    });
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    return await res.json();
}
// --- Warehouses & Transfers ---
export async function fetchWarehouses() {
    return cachedGet(`${API_BASE_URL}/warehouses`);
}
export async function createWarehouseApi(data) {
    const res = await fetch(`${API_BASE_URL}/warehouses`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create warehouse");
    }
    clearApiCache();
    return await res.json();
}
export async function updateWarehouseApi(id, data) {
    const res = await fetch(`${API_BASE_URL}/warehouses/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update warehouse");
    }
    clearApiCache();
    return await res.json();
}
export async function fetchTransfers(params = {}) {
    const query = new URLSearchParams();
    if (params.status)
        query.set("status", params.status);
    if (params.warehouse_id)
        query.set("warehouse_id", params.warehouse_id);
    const url = `${API_BASE_URL}/transfers${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await fetch(url, {
        cache: "no-store",
        headers: getHeaders(),
    });
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    return await res.json();
}
export async function createTransferApi(data) {
    const res = await fetch(`${API_BASE_URL}/transfers`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create transfer");
    }
    clearApiCache();
    return await res.json();
}
export async function dispatchTransferApi(id) {
    const res = await fetch(`${API_BASE_URL}/transfers/${id}/dispatch`, {
        method: "POST",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to dispatch transfer");
    }
    clearApiCache();
    return await res.json();
}
export async function receiveTransferApi(id) {
    const res = await fetch(`${API_BASE_URL}/transfers/${id}/receive`, {
        method: "POST",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to receive transfer");
    }
    clearApiCache();
    return await res.json();
}
export async function cancelTransferApi(id) {
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
export async function fetchCustomers(search) {
    const query = new URLSearchParams();
    if (search)
        query.set("search", search);
    const url = `${API_BASE_URL}/customers${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await fetch(url, {
        cache: "no-store",
        headers: getHeaders(),
    });
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    return await res.json();
}
export async function createCustomerApi(data) {
    const res = await fetch(`${API_BASE_URL}/customers`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create customer");
    }
    clearApiCache();
    return await res.json();
}
// --- Sales Orders ---
export async function fetchOrders(params = {}) {
    const query = new URLSearchParams();
    if (params.status)
        query.set("status", params.status);
    if (params.customer_id)
        query.set("customer_id", params.customer_id);
    const url = `${API_BASE_URL}/orders${query.toString() ? `?${query.toString()}` : ""}`;
    return cachedGet(url);
}
export async function createOrderApi(data) {
    const res = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create order");
    }
    clearApiCache();
    return await res.json();
}
export async function confirmOrderApi(id) {
    const res = await fetch(`${API_BASE_URL}/orders/${id}/confirm`, {
        method: "POST",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to confirm order");
    }
    clearApiCache();
    return await res.json();
}
export async function fulfillOrderApi(id) {
    const res = await fetch(`${API_BASE_URL}/orders/${id}/fulfill`, {
        method: "POST",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to fulfill order");
    }
    clearApiCache();
    return await res.json();
}
export async function cancelOrderApi(id) {
    const res = await fetch(`${API_BASE_URL}/orders/${id}/cancel`, {
        method: "POST",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to cancel order");
    }
    clearApiCache();
    return await res.json();
}
// --- Suppliers ---
export async function fetchSuppliers(search) {
    const query = new URLSearchParams();
    if (search)
        query.set("search", search);
    const url = `${API_BASE_URL}/suppliers${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await fetch(url, {
        cache: "no-store",
        headers: getHeaders(),
    });
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    return await res.json();
}
export async function createSupplierApi(data) {
    const res = await fetch(`${API_BASE_URL}/suppliers`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create supplier");
    }
    clearApiCache();
    return await res.json();
}
// --- Purchase Orders ---
export async function fetchPurchaseOrders(params = {}) {
    const query = new URLSearchParams();
    if (params.status)
        query.set("status", params.status);
    if (params.supplier_id)
        query.set("supplier_id", params.supplier_id);
    const url = `${API_BASE_URL}/purchase-orders${query.toString() ? `?${query.toString()}` : ""}`;
    return cachedGet(url);
}
export async function createPurchaseOrderApi(data) {
    const res = await fetch(`${API_BASE_URL}/purchase-orders`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create purchase order");
    }
    clearApiCache();
    return await res.json();
}
export async function issuePurchaseOrderApi(id) {
    const res = await fetch(`${API_BASE_URL}/purchase-orders/${id}/issue`, {
        method: "POST",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to issue purchase order");
    }
    clearApiCache();
    return await res.json();
}
export async function receivePurchaseOrderApi(id) {
    const res = await fetch(`${API_BASE_URL}/purchase-orders/${id}/receive`, {
        method: "POST",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to receive purchase order");
    }
    clearApiCache();
    return await res.json();
}
export async function cancelPurchaseOrderApi(id) {
    const res = await fetch(`${API_BASE_URL}/purchase-orders/${id}/cancel`, {
        method: "POST",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to cancel purchase order");
    }
    clearApiCache();
    return await res.json();
}
// --- Shipments & Logistics Tracking ---
export async function fetchShipments(params = {}) {
    const query = new URLSearchParams();
    if (params.status)
        query.set("status", params.status);
    if (params.order_id)
        query.set("order_id", params.order_id);
    const url = `${API_BASE_URL}/shipments${query.toString() ? `?${query.toString()}` : ""}`;
    return cachedGet(url);
}
export async function fetchShipmentById(id) {
    const res = await fetch(`${API_BASE_URL}/shipments/${id}`, {
        cache: "no-store",
        headers: getHeaders(),
    });
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    return await res.json();
}
export async function createShipmentApi(data) {
    const res = await fetch(`${API_BASE_URL}/shipments`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create shipment");
    }
    clearApiCache();
    return await res.json();
}
export async function dispatchShipmentApi(id, data) {
    const res = await fetch(`${API_BASE_URL}/shipments/${id}/dispatch`, {
        method: "POST",
        headers: getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to dispatch shipment");
    }
    clearApiCache();
    return await res.json();
}
export async function outForDeliveryShipmentApi(id, data) {
    const res = await fetch(`${API_BASE_URL}/shipments/${id}/out-for-delivery`, {
        method: "POST",
        headers: getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to mark shipment out for delivery");
    }
    clearApiCache();
    return await res.json();
}
export async function deliverShipmentApi(id, data) {
    const res = await fetch(`${API_BASE_URL}/shipments/${id}/deliver`, {
        method: "POST",
        headers: getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to mark shipment delivered");
    }
    clearApiCache();
    return await res.json();
}
export async function cancelShipmentApi(id, data) {
    const res = await fetch(`${API_BASE_URL}/shipments/${id}/cancel`, {
        method: "POST",
        headers: getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to cancel shipment");
    }
    clearApiCache();
    return await res.json();
}
export async function addShipmentEventApi(id, data) {
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
export async function fetchInvoices(params = {}) {
    const query = new URLSearchParams();
    if (params.status)
        query.set("status", params.status);
    if (params.customer_id)
        query.set("customer_id", params.customer_id);
    const url = `${API_BASE_URL}/invoices${query.toString() ? `?${query.toString()}` : ""}`;
    return cachedGet(url);
}
export async function fetchInvoiceById(id) {
    const res = await fetch(`${API_BASE_URL}/invoices/${id}`, {
        cache: "no-store",
        headers: getHeaders(),
    });
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    return await res.json();
}
export async function createInvoiceApi(data) {
    const res = await fetch(`${API_BASE_URL}/invoices`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create invoice");
    }
    clearApiCache();
    return await res.json();
}
export async function createInvoiceFromOrderApi(orderId, taxRate = 18.0) {
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
export async function issueInvoiceApi(id) {
    const res = await fetch(`${API_BASE_URL}/invoices/${id}/issue`, {
        method: "POST",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to issue invoice");
    }
    clearApiCache();
    return await res.json();
}
export async function voidInvoiceApi(id) {
    const res = await fetch(`${API_BASE_URL}/invoices/${id}/void`, {
        method: "POST",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to void invoice");
    }
    clearApiCache();
    return await res.json();
}
export async function fetchPayments(params = {}) {
    const query = new URLSearchParams();
    if (params.invoice_id)
        query.set("invoice_id", params.invoice_id);
    const url = `${API_BASE_URL}/payments${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await fetch(url, {
        cache: "no-store",
        headers: getHeaders(),
    });
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    return await res.json();
}
export async function recordPaymentApi(data) {
    const res = await fetch(`${API_BASE_URL}/payments`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to record payment");
    }
    clearApiCache();
    return await res.json();
}
export async function fetchDashboardSummary() {
    const res = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
        cache: "no-store",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 404 && typeof err?.detail === "string" && err.detail.includes("User '") && typeof window !== "undefined") {
            localStorage.removeItem("flowstock_user_id");
            localStorage.removeItem("flowstock_user_name");
            localStorage.removeItem("flowstock_user_role");
        }
        throw new Error(err.detail || "Failed to load dashboard metrics");
    }
    return await res.json();
}
export async function fetchNotifications(params = {}) {
    const query = new URLSearchParams();
    if (params.unread_only)
        query.set("unread_only", "true");
    if (params.limit)
        query.set("limit", params.limit.toString());
    const url = `${API_BASE_URL}/notifications${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await fetch(url, {
        cache: "no-store",
        headers: getHeaders(),
    });
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    return await res.json();
}
export async function fetchUnreadNotificationCount() {
    try {
        const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
            cache: "no-store",
            headers: getHeaders(),
        });
        if (!res.ok)
            return 0;
        const data = await res.json();
        return data.unread_count || 0;
    }
    catch {
        return 0;
    }
}
export async function markNotificationRead(id) {
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
export async function markAllNotificationsRead() {
    const res = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: "POST",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to mark all as read");
    }
}
export async function fetchAuditLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.entity_type)
        query.set("entity_type", params.entity_type);
    if (params.action)
        query.set("action", params.action);
    if (params.search)
        query.set("search", params.search);
    if (params.limit)
        query.set("limit", params.limit.toString());
    if (params.offset)
        query.set("offset", params.offset.toString());
    const url = `${API_BASE_URL}/audit${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await fetch(url, {
        cache: "no-store",
        headers: getHeaders(),
    });
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    return await res.json();
}
// --- Background Jobs & Automation ---
export async function fetchAvailableJobs() {
    const res = await fetch(`${API_BASE_URL}/jobs/available`, {
        cache: "no-store",
        headers: getHeaders(),
    });
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    return await res.json();
}
export async function fetchJobExecutions(limit = 20) {
    const res = await fetch(`${API_BASE_URL}/jobs?limit=${limit}`, {
        cache: "no-store",
        headers: getHeaders(),
    });
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    return await res.json();
}
export async function triggerJobApi(jobName) {
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

export async function loginApi(email, password) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            credentials: "include",
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || "Invalid email or password");
        }
        return await res.json();
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") {
            throw new Error("Server took too long to respond. Please try again.");
        }
        throw err;
    }
}

export async function signupApi(data) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
        const res = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: "include",
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || "Signup failed");
        }
        return await res.json();
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") {
            throw new Error("Server took too long to respond. Please try again.");
        }
        throw err;
    }
}

export async function fetchMe(token) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
        const headers = {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers,
            credentials: "include",
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error("Session expired");
        return await res.json();
    } catch (err) {
        clearTimeout(timeoutId);
        throw err;
    }
}

export async function logoutApi() {
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            credentials: "include",
        });
    } catch {
        // ignore logout network errors
    }
}
