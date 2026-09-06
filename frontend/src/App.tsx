import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { TenantProvider } from './context/TenantContext'
import { AppShell } from './components/layout/AppShell'
import OverviewPage from './app/page'
import ProductsPage from './app/products/page'
import InventoryPage from './app/inventory/page'
import WarehousesPage from './app/warehouses/page'
import OrdersPage from './app/orders/page'
import PurchasingPage from './app/purchasing/page'
import ShipmentsPage from './app/shipments/page'
import InvoicesPage from './app/invoices/page'
import AuditPage from './app/audit/page'
import SettingsPage from './app/settings/page'

export default function App() {
  return (
    <BrowserRouter>
      <TenantProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/warehouses" element={<WarehousesPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/purchasing" element={<PurchasingPage />} />
            <Route path="/shipments" element={<ShipmentsPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </TenantProvider>
    </BrowserRouter>
  )
}
