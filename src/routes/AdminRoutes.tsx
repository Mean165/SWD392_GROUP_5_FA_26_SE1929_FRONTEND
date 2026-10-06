import { Navigate, Route, Routes } from 'react-router-dom';
import { ROLES } from '../constants/roles';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from './ProtectedRoute';
import UsersPage from '../pages/admin/UsersPage';
import ExamSessionsPage from '../pages/admin/ExamSessionsPage';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
        <Route element={<AdminLayout />}>
          {/* Index & Dashboard redirect to /admin/exam-sessions per requirement */}
          <Route path="" element={<Navigate to="/admin/exam-sessions" replace />} />
          <Route path="dashboard" element={<Navigate to="/admin/exam-sessions" replace />} />
          <Route path="/admin/dashboard" element={<Navigate to="/admin/exam-sessions" replace />} />

          {/* Exam Sessions Routes */}
          <Route path="exam-sessions" element={<ExamSessionsPage />} />
          <Route path="/admin/exam-sessions" element={<ExamSessionsPage />} />

          {/* Users Routes */}
          <Route path="users" element={<UsersPage />} />
          <Route path="/admin/users" element={<UsersPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/admin/exam-sessions" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
