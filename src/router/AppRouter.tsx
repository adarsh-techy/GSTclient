import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MainLayout } from '../components';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { useAuth } from '../auth/AuthContext';

const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const InvoicesPage = lazy(() => import('../pages/invoices/InvoicesPage'));
const EInvoiceHistoryPage = lazy(() => import('../pages/einvoice-history/EInvoiceHistoryPage'));
const EWayBillsPage = lazy(() => import('../pages/eway-bills/EWayBillsPage'));
const Gstr1ReturnPage = lazy(() => import('../pages/gstr1-return/Gstr1ReturnPage'));
const Gstr2bItcPage = lazy(() => import('../pages/gstr2b-itc/Gstr2bItcPage'));
const Gstr3bReturnPage = lazy(() => import('../pages/gstr3b-return/Gstr3bReturnPage'));
const BillOfEntryPage = lazy(() => import('../pages/bill-of-entry/BillOfEntryPage'));
const ReconciliationPage = lazy(() => import('../pages/reconciliation/ReconciliationPage'));
const FilingsRegisterPage = lazy(() => import('../pages/filings-register/FilingsRegisterPage'));
const UserManagementPage = lazy(() => import('../pages/user-management/UserManagementPage'));
const SystemSettingsPage = lazy(() => import('../pages/system-settings/SystemSettingsPage'));
const ClientOnboardingPage = lazy(() => import('../pages/client-onboarding/ClientOnboardingPage'));
const LoginPage = lazy(() => import('../pages/authentication/LoginPage'));

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] gap-3 text-slate-500 dark:text-slate-400">
      <span className="spinner w-6 h-6 border-[3px]" />
      <span className="text-sm font-medium">Loading workspace…</span>
    </div>
  );
}

export const AppRouter: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    if (location.pathname === '/login') {
      return (
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      );
    }
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
          <Route path="/einvoice-history" element={<ProtectedRoute><EInvoiceHistoryPage /></ProtectedRoute>} />
          <Route path="/ewaybills" element={<ProtectedRoute><EWayBillsPage /></ProtectedRoute>} />
          <Route path="/gstr1" element={<ProtectedRoute><Gstr1ReturnPage /></ProtectedRoute>} />
          <Route path="/gstr2b" element={<ProtectedRoute><Gstr2bItcPage /></ProtectedRoute>} />
          <Route path="/gstr3b" element={<ProtectedRoute><Gstr3bReturnPage /></ProtectedRoute>} />
          <Route path="/bill-of-entry" element={<ProtectedRoute><BillOfEntryPage /></ProtectedRoute>} />
          <Route path="/recon" element={<ProtectedRoute><ReconciliationPage /></ProtectedRoute>} />
          <Route path="/filings" element={<ProtectedRoute><FilingsRegisterPage /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute requiredRole="Admin"><UserManagementPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute requiredRole="Admin"><SystemSettingsPage /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute requiredRole="Admin"><ClientOnboardingPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
