import { Navigate, Route, Routes } from 'react-router-dom';
import { ROLES } from '../constants/roles';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from './ProtectedRoute';
import DashboardPage from '../pages/admin/DashboardPage';
import UsersPage from '../pages/admin/UsersPage';
import SubjectsPage from '../pages/admin/SubjectsPage';
import SubjectAssignmentsPage from '../pages/admin/SubjectAssignmentsPage';
import SystemConfigurationPage from '../pages/admin/SystemConfigurationPage';
import AuditLogsPage from '../pages/admin/AuditLogsPage';
import { AccountProfilePage } from '../pages/AccountPages';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="subject-assignments" element={<SubjectAssignmentsPage />} />
          <Route path="settings" element={<SystemConfigurationPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="profile" element={<AccountProfilePage roleLabel="Quản trị viên" />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
