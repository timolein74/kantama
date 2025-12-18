import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case 'ADMIN':
        return <Navigate to="/admin" replace />;
      case 'FINANCIER':
        return <Navigate to="/financier" replace />;
      case 'CUSTOMER':
        return <Navigate to="/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}

