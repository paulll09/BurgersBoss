import { useState, useMemo, lazy, Suspense, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import { AdminErrorBoundary } from './components/admin/AdminErrorBoundary';
import ScrollToTop from './components/layout/ScrollToTop';
import Loader from './components/layout/Loader';
import HomePage from './pages/HomePage';
import Cart from './components/cart/Cart';
import { OverlayCtx } from './context/overlayCtx';
import { BarCtx } from './context/barCtx';
import { FeaturesCtx } from './context/featuresCtx';
import { useSchedule } from './hooks/useSchedule';
import { useAdminSession } from './hooks/useAdminSession';
import { ConfirmProvider } from './components/ui/ConfirmDialog';

const Login            = lazy(() => import('./components/admin/Login'));
const Dashboard        = lazy(() => import('./components/admin/Dashboard'));
const AdminProducts    = lazy(() => import('./components/admin/AdminProducts'));
const AdminCategories  = lazy(() => import('./components/admin/AdminCategories'));
const AdminHours       = lazy(() => import('./components/admin/AdminHours'));
const AdminQR          = lazy(() => import('./components/admin/AdminQR'));
const AdminExtras      = lazy(() => import('./components/admin/AdminExtras'));
const AdminOrders      = lazy(() => import('./components/admin/AdminOrders'));
const AdminVentas       = lazy(() => import('./components/admin/AdminVentas'));
const AdminGastos       = lazy(() => import('./components/admin/AdminGastos'));
const AdminCierreCaja   = lazy(() => import('./components/admin/AdminCierreCaja'));

const AdminFallback = () => (
  <div className="max-w-4xl mx-auto animate-pulse">
    <div className="h-8 w-48 bg-gray-200 rounded-lg mb-6" />
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 bg-gray-100 rounded-xl" />
      ))}
    </div>
  </div>
);

function ProtectedAdminLayout() {
  const status = useAdminSession();
  if (status === 'checking') return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f5f4f0' }}>
      <AdminFallback />
    </div>
  );
  if (status === 'denied') return <Navigate to="/admin" replace />;
  return <AdminLayout />;
}

function App() {
  const [loading, setLoading] = useState(true);
  const [overlayActive, setOverlayActive] = useState(false);
  const { isOpen, schedule, features } = useSchedule();

  const handleLoaderComplete = useCallback(() => setLoading(false), []);

  const barCtxValue      = useMemo(() => ({ isOpen, schedule, appLoading: loading }), [isOpen, schedule, loading]);
  const overlayCtxValue  = useMemo(() => ({ active: overlayActive, setActive: setOverlayActive }), [overlayActive]);

  return (
    <FeaturesCtx.Provider value={features}>
    <BarCtx.Provider value={barCtxValue}>
    <OverlayCtx.Provider value={overlayCtxValue}>
    <ConfirmProvider>
      <AnimatePresence>
        {loading && <Loader onComplete={handleLoaderComplete} />}
      </AnimatePresence>

      {!loading && (
        <BrowserRouter>
          <ScrollToTop />
          <AdminErrorBoundary>
          <Suspense fallback={null}>
            <Routes>
              {/* ── Public routes (with Layout) ── */}
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/cart" element={<Cart />} />
              </Route>

              {/* ── Admin login (no sidebar) ── */}
              <Route path="/admin" element={
                <div className="min-h-screen flex items-center justify-center bg-[#f5f4f0] px-4">
                  <Suspense fallback={<AdminFallback />}>
                    <Login />
                  </Suspense>
                </div>
              } />

              {/* ── Admin protected (with sidebar) ── */}
              <Route element={<ProtectedAdminLayout />}>
                <Route path="/admin/dashboard"  element={<Suspense fallback={<AdminFallback />}><Dashboard /></Suspense>} />
                <Route path="/admin/orders"     element={<Suspense fallback={<AdminFallback />}><AdminOrders /></Suspense>} />
                <Route path="/admin/products"   element={<Suspense fallback={<AdminFallback />}><AdminProducts /></Suspense>} />
                <Route path="/admin/categories" element={<Suspense fallback={<AdminFallback />}><AdminCategories /></Suspense>} />
                <Route path="/admin/extras"     element={<Suspense fallback={<AdminFallback />}><AdminExtras /></Suspense>} />
                <Route path="/admin/ventas"     element={<Suspense fallback={<AdminFallback />}><AdminVentas /></Suspense>} />
                <Route path="/admin/gastos"     element={<Suspense fallback={<AdminFallback />}><AdminGastos /></Suspense>} />
                <Route path="/admin/cierre"     element={<Suspense fallback={<AdminFallback />}><AdminCierreCaja /></Suspense>} />
                <Route path="/admin/hours"      element={<Suspense fallback={<AdminFallback />}><AdminHours /></Suspense>} />
                <Route path="/admin/qr"         element={<Suspense fallback={<AdminFallback />}><AdminQR /></Suspense>} />
              </Route>
            </Routes>
          </Suspense>
          </AdminErrorBoundary>
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 2500,
              style: {
                background: '#fff',
                color: '#111',
                border: '1px solid rgba(0,0,0,0.07)',
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                fontWeight: 500,
                borderRadius: '14px',
                padding: '12px 16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                maxWidth: '380px',
              },
              success: { iconTheme: { primary: '#1B5E20', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#1B5E20', secondary: '#fff' } },
            }}
          />
        </BrowserRouter>
      )}
    </ConfirmProvider>
    </OverlayCtx.Provider>
    </BarCtx.Provider>
    </FeaturesCtx.Provider>
  );
}

export default App;
