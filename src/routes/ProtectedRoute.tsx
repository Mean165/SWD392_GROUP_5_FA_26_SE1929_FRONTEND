import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { UserRole } from '../constants/roles';
import { useAuth } from '../hooks/useAuth';

type ProtectedRouteProps = {
  allowedRoles?: UserRole[];
};

export default function ProtectedRoute({ allowedRoles = [] }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles.length > 0 && (!user || !allowedRoles.includes(user.role as UserRole))) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
