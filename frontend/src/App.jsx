import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TenantProvider } from './context/TenantContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
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
import LoginPage from './pages/Login';

import { PageSkeleton } from './components/ui/Skeleton';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { SWRConfig } from 'swr';
import { swrConfig } from './lib/swr';

function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#14171F] flex items-center justify-center">
            <PageSkeleton />
        </div>
    );
    if (!isAuthenticated) return <Navigate to="/" replace />;
    return children;
}

function AppLayout() {
    const location = useLocation();
    const prefersReducedMotion = useReducedMotion();
    const isPublic = location.pathname === '/' || location.pathname === '/welcome' || location.pathname === '/login';

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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><OverviewPage /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
            <Route path="/warehouses" element={<ProtectedRoute><WarehousesPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/purchasing" element={<ProtectedRoute><PurchasingPage /></ProtectedRoute>} />
            <Route path="/shipments" element={<ProtectedRoute><ShipmentsPage /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
            <Route path="/audit" element={<ProtectedRoute><AuditPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    );

    return isPublic ? content : <AppShell>{content}</AppShell>;
}

export default function App() {
    return (
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <TenantProvider>
              <ToastProvider>
                <SWRConfig value={swrConfig}>
                  <ErrorBoundary>
                    <AppLayout />
                  </ErrorBoundary>
                </SWRConfig>
              </ToastProvider>
            </TenantProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
}

