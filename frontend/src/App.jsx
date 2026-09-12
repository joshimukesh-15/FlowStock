import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TenantProvider } from './context/TenantContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './components/layout/AppShell';
import { AppProgressBar } from './components/layout/AppProgressBar';
import { DURATION, EASING, useReducedMotion } from './motion';
import OverviewPage from './pages/Dashboard';
import ProductsPage from './pages/Products';
import InventoryPage from './pages/Inventory';
import WarehousesPage from './pages/Warehouses';
import OrdersPage from './pages/Orders';
import PurchasingPage from './pages/Purchasing';
import ShipmentsPage from './pages/Shipments';
import InvoicesPage from './pages/Invoices';
import AuditPage from './pages/Audit';
import SettingsPage from './pages/Settings';
import WelcomePage from './pages/Welcome';

function AppLayout() {
    const location = useLocation();
    const prefersReducedMotion = useReducedMotion();
    const isWelcome = location.pathname === '/' || location.pathname === '/welcome';

    const content = (
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? undefined : {
            opacity: 0,
            transition: { duration: DURATION.micro, ease: EASING.standard },
          }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.18,
            ease: EASING.standard,
          }}
          className="w-full"
        >
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/dashboard" element={<OverviewPage />} />
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
    );

    return (
      <>
        <AppProgressBar />
        {isWelcome ? content : <AppShell>{content}</AppShell>}
      </>
    );
}

export default function App() {
    return (
      <BrowserRouter>
        <ThemeProvider>
          <TenantProvider>
            <ToastProvider>
              <AppLayout />
            </ToastProvider>
          </TenantProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
}
