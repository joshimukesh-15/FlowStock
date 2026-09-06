"""Top-Level API v1 Router."""
from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    organizations,
    categories,
    products,
    inventory,
    warehouses,
    transfers,
    customers,
    orders,
    suppliers,
    purchase_orders,
    shipments,
    invoices,
    analytics,
    audit,
    notifications,
    jobs,
    websocket,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["Organizations"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
api_router.include_router(warehouses.router, prefix="/warehouses", tags=["Warehouses"])
api_router.include_router(transfers.router, prefix="/transfers", tags=["Transfers"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["Suppliers"])
api_router.include_router(purchase_orders.router, prefix="/purchase-orders", tags=["Purchase Orders"])
api_router.include_router(shipments.router, prefix="/shipments", tags=["Shipments"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["Invoices"])
api_router.include_router(invoices.payments_router, prefix="/payments", tags=["Payments"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit Log"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["Background Jobs"])
api_router.include_router(websocket.router, tags=["WebSockets"])


