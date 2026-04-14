import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import Layout from './components/layout/Layout';
import { AdminErrorBoundary } from './components/admin/AdminErrorBoundary';
import ScrollToTop from './components/layout/ScrollToTop';
import Loader from './components/layout/Loader';
import HomePage from './pages/HomePage';
import Cart from './components/cart/Cart';
import { OverlayCtx } from './context/overlayCtx';
import { BarCtx } from './context/barCtx';
import { useSchedule } from './hooks/useSchedule';
import { ConfirmProvider } from './components/ui/ConfirmDialog';

const Login = lazy(() => import('./components/admin/Login'));
const Dashboard = lazy(() => import('./components/admin/Dashboard'));
const AdminProducts = lazy(() => import('./components/admin/AdminProducts'));
const AdminCategories = lazy(() => import('./components/admin/AdminCategories'));
const AdminHours = lazy(() => import('./components/admin/AdminHours'));
const AdminQR = lazy(() => import('./components/admin/AdminQR'));
const AdminPromotions = lazy(() => import('./components/admin/AdminPromotions'));

function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStatus('ok');
      else { setStatus('denied'); navigate('/admin'); }
    });
  }, []);

  if (status === 'checking') return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded-lg mb-6" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
  if (status === 'denied') return null;
  return children;
}

const AdminFallback = () => (
  <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-pulse">
    <div className="h-8 w-48 bg-gray-200 rounded-lg mb-6" />
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 bg-gray-100 rounded-xl" />
      ))}
    </div>
  </div>
);

function App() {
  const [loading, setLoading] = useState(true);
  const [overlayActive, setOverlayActive] = useState(false);
  const { isOpen, schedule } = useSchedule();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 2200);
    return () => clearTimeout(t);
  }, []);

  const barCtxValue = useMemo(() => ({ isOpen, schedule, appLoading: loading }), [isOpen, schedule, loading]);
  const overlayCtxValue = useMemo(() => ({ active: overlayActive, setActive: setOverlayActive }), [overlayActive]);

  return (
    <BarCtx.Provider value={barCtxValue}>
    <OverlayCtx.Provider value={overlayCtxValue}>
    <ConfirmProvider>
    <BrowserRouter>
      {loading && <Loader />}
      <ScrollToTop />
      <Layout>
        <AdminErrorBoundary>
        <Suspense fallback={<AdminFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/admin" element={
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                <Login />
              </div>
            } />
            <Route path="/admin/dashboard" element={
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              </div>
            } />
            <Route path="/admin/products" element={
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                <ProtectedRoute><AdminProducts /></ProtectedRoute>
              </div>
            } />
            <Route path="/admin/categories" element={
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                <ProtectedRoute><AdminCategories /></ProtectedRoute>
              </div>
            } />
            <Route path="/admin/hours" element={
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                <ProtectedRoute><AdminHours /></ProtectedRoute>
              </div>
            } />
            <Route path="/admin/qr" element={
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                <ProtectedRoute><AdminQR /></ProtectedRoute>
              </div>
            } />
            <Route path="/admin/promotions" element={
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                <ProtectedRoute><AdminPromotions /></ProtectedRoute>
              </div>
            } />
          </Routes>
        </Suspense>
        </AdminErrorBoundary>
      </Layout>
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
          success: {
            iconTheme: { primary: '#1B5E20', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#1B5E20', secondary: '#fff' },
          },
        }}
      />
    </BrowserRouter>
    </ConfirmProvider>
    </OverlayCtx.Provider>
    </BarCtx.Provider>
  );
}

export default App;
