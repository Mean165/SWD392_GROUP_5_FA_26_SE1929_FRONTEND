import { Route, Routes } from 'react-router-dom';
import { ROLES } from '../constants/roles';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from './ProtectedRoute';
import DashboardPage from '../pages/admin/DashboardPage';
import UsersPage from '../pages/admin/UsersPage';
import SubjectsPage from '../pages/admin/SubjectsPage';
import SubjectAssignmentsPage from '../pages/admin/SubjectAssignmentsPage';
import SystemConfigurationPage from '../pages/admin/SystemConfigurationPage';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/subjects" element={<SubjectsPage />} />
          <Route path="/admin/subject-assignments" element={<SubjectAssignmentsPage />} />
          <Route path="/admin/settings" element={<SystemConfigurationPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
