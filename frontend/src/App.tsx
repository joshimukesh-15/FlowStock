import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { TenantProvider } from './context/TenantContext'
import { AppShell } from './components/layout/AppShell'
import { DURATION, EASING, useReducedMotion } from './motion'
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

function AnimatedRoutes() {
  const location = useLocation()
  const prefersReducedMotion = useReducedMotion()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={
          prefersReducedMotion
            ? undefined
            : {
                opacity: 0,
                transition: { duration: DURATION.micro, ease: EASING.standard },
              }
        }
        transition={{
          duration: prefersReducedMotion ? 0 : DURATION.normal,
          ease: EASING.standard,
        }}
        className="w-full"
      >
        <Routes location={location} key={location.pathname}>
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
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <TenantProvider>
        <AppShell>
          <AnimatedRoutes />
        </AppShell>
      </TenantProvider>
    </BrowserRouter>
  )
}

