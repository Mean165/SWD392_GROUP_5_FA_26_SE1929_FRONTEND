import { Navigate, Outlet } from 'react-router-dom';
import type { UserRole } from '../constants/roles';
import { useAuth } from '../hooks/useAuth';

type ProtectedRouteProps = {
  allowedRoles?: UserRole[];
};

export default function ProtectedRoute({ allowedRoles = [] }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && (!user || !allowedRoles.includes(user.role as UserRole))) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
