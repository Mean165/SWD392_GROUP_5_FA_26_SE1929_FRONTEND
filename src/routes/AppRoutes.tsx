import { Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import LoginPage from '../pages/auth/LoginPage';
import NotFoundPage from '../pages/auth/NotFoundPage';
import ForbiddenPage from '../pages/auth/ForbiddenPage';
import AdminRoutes from './AdminRoutes';
import LecturerRoutes from './LecturerRoutes';
import StudentRoutes from './StudentRoutes';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/404" element={<NotFoundPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/404" replace />} />

      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/lecturer/*" element={<LecturerRoutes />} />
      <Route path="/student/*" element={<StudentRoutes />} />
    </Routes>
  );
}
