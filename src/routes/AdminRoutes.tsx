import { Navigate, Route, Routes } from 'react-router-dom';
import { ROLES } from '../constants/roles';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from './ProtectedRoute';
import DashboardPage from '../pages/admin/DashboardPage';
import UsersPage from '../pages/admin/UsersPage';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
        <Route element={<AdminLayout />}>
          <Route path="" element={<Navigate to="/admin/users" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="*" element={<Navigate to="/admin/users" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
