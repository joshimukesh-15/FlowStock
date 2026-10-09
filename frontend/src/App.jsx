import { useState } from 'react';
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
import { AccessDenied } from './components/ui/AccessDenied';
import { usePermissions } from './hooks/usePermissions';
import { SWRConfig } from 'swr';
import { swrConfig } from './lib/swr';

function ProtectedRoute({ children, path }) {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();
    const { role, meta, isRouteAllowed } = usePermissions();
    const checkPath = path || location.pathname;

    if (loading) return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#11120D] flex items-center justify-center">
            <PageSkeleton />
        </div>
    );
    if (!isAuthenticated) return <Navigate to="/" replace />;

    if (!isRouteAllowed(checkPath)) {
        return <AccessDenied currentPath={checkPath} role={role} meta={meta} />;
    }

    return children;
}

/* Route order used to decide swipe direction */
const PUBLIC_ORDER = ['/', '/welcome', '/login'];

function getDirection(from, to) {
    const fi = PUBLIC_ORDER.indexOf(from);
    const ti = PUBLIC_ORDER.indexOf(to);
    if (fi === -1 || ti === -1) return 0;
    return ti > fi ? 1 : -1; // 1 = swipe left (forward), -1 = swipe right (back)
}

function AppLayout() {
    const location = useLocation();
    const prefersReducedMotion = useReducedMotion();
    const isPublic = PUBLIC_ORDER.includes(location.pathname);

    // Track previous pathname so we can compute direction
    const [prevPath, setPrevPath] = useState(location.pathname);
    const [dir, setDir] = useState(0);

    if (prevPath !== location.pathname) {
        setPrevPath(location.pathname);
        setDir(getDirection(prevPath, location.pathname));
    }
    const dist = prefersReducedMotion ? 0 : 48; // px slide distance

    // Public routes: card swipe; app routes: plain fade
    const publicVariants = {
        initial: (d) => ({ opacity: 0, x: d * dist }),
        animate: { opacity: 1, x: 0 },
        exit:    (d) => ({ opacity: 0, x: d * -dist }),
    };

    const appVariants = {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit:    { opacity: 0 },
    };

    const variants = isPublic ? publicVariants : appVariants;

    const content = (
      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.div
          key={location.pathname}
          custom={dir}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{
            duration: prefersReducedMotion ? 0 : isPublic ? 0.32 : 0.18,
            ease: isPublic ? [0.32, 0, 0.08, 1] : EASING.standard,
          }}
          className="w-full"
          style={{ willChange: 'transform, opacity' }}
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

