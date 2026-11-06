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

  const rawRole = String(user?.role ?? '').toUpperCase().replace(/^ROLE_/, '');
  const normalizedRole = rawRole === 'LE' ? 'LECTURER' : rawRole === 'AD' ? 'ADMIN' : rawRole === 'ST' ? 'STUDENT' : rawRole;
  if (allowedRoles.length > 0 && (!user || !allowedRoles.includes(normalizedRole as UserRole))) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
