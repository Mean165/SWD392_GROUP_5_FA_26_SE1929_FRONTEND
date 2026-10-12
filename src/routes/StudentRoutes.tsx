import { Navigate, Route, Routes } from 'react-router-dom';
import { ROLES } from '../constants/roles';
import StudentLayout from '../layouts/StudentLayout';
import ProtectedRoute from './ProtectedRoute';
import StudentDashboardPage from '../pages/student/DashboardPage';
import ExamSchedulePage from '../pages/student/ExamSchedulePage';
import ExamDetailPage from '../pages/student/ExamDetailPage';
import InterviewPage from '../pages/student/InterviewPage';
import ExamReportPage from '../pages/student/ExamReportPage';

export default function StudentRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={[ROLES.STUDENT]} />}>
        <Route element={<StudentLayout />}>
          <Route path="" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboardPage />} />
          <Route path="/student/dashboard" element={<StudentDashboardPage />} />
          <Route path="exams" element={<ExamSchedulePage />} />
          <Route path="/student/exams" element={<ExamSchedulePage />} />
          <Route path="exams/:id" element={<ExamDetailPage />} />
          <Route path="/student/exams/:id" element={<ExamDetailPage />} />
          <Route path="interview/:id" element={<InterviewPage />} />
          <Route path="/student/interview/:id" element={<InterviewPage />} />
          <Route path="reports/:id" element={<ExamReportPage />} />
          <Route path="/student/reports/:id" element={<ExamReportPage />} />
          <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
