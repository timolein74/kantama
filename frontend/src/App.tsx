import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import FinancierLayout from './layouts/FinancierLayout';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyPage from './pages/VerifyPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';

// Customer pages
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerApplications from './pages/customer/Applications';
import CustomerApplicationDetail from './pages/customer/ApplicationDetail';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminFinanciers from './pages/admin/Financiers';
import AdminFinancierDetail from './pages/admin/FinancierDetail';
import AdminApplications from './pages/admin/Applications';
import AdminApplicationDetail from './pages/admin/ApplicationDetail';
import AdminOffers from './pages/admin/Offers';
import AdminContracts from './pages/admin/Contracts';
import AdminUsers from './pages/admin/Users';

// Financier pages
import FinancierDashboard from './pages/financier/Dashboard';
import FinancierApplications from './pages/financier/Applications';
import FinancierApplicationDetail from './pages/financier/ApplicationDetail';

// Components
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import { DemoPanel } from './components/DemoPanel';

function App() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e1b4b',
            color: '#fff',
            borderRadius: '12px',
          },
        }}
      />
      
      <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify" element={<VerifyPage />} />
        </Route>

        {/* Legal pages (standalone) */}
        <Route path="/tietosuoja" element={<PrivacyPolicy />} />
        <Route path="/kayttoehdot" element={<Terms />} />

        {/* Customer routes */}
        <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<CustomerDashboard />} />
            <Route path="/dashboard/applications" element={<CustomerApplications />} />
            <Route path="/dashboard/applications/:id" element={<CustomerApplicationDetail />} />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/financiers" element={<AdminFinanciers />} />
            <Route path="/admin/financiers/:id" element={<AdminFinancierDetail />} />
            <Route path="/admin/applications" element={<AdminApplications />} />
            <Route path="/admin/applications/:id" element={<AdminApplicationDetail />} />
            <Route path="/admin/offers" element={<AdminOffers />} />
            <Route path="/admin/contracts" element={<AdminContracts />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
        </Route>

        {/* Financier routes */}
        <Route element={<ProtectedRoute allowedRoles={['FINANCIER']} />}>
          <Route element={<FinancierLayout />}>
            <Route path="/financier" element={<FinancierDashboard />} />
            <Route path="/financier/applications" element={<FinancierApplications />} />
            <Route path="/financier/applications/:id" element={<FinancierApplicationDetail />} />
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Demo panel for easy user switching */}
      <DemoPanel />
    </>
  );
}

export default App;

