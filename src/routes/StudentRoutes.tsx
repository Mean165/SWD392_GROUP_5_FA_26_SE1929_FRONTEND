import { Navigate, Route, Routes } from 'react-router-dom';
import { ROLES } from '../constants/roles';
import StudentLayout from '../layouts/StudentLayout';
import ProtectedRoute from './ProtectedRoute';
import StudentDashboardPage from '../pages/student/DashboardPage';
import ExamSchedulePage from '../pages/student/ExamSchedulePage';
import ExamDetailPage from '../pages/student/ExamDetailPage';
import ExamReadinessPage from '../pages/student/ExamReadinessPage';
import InterviewPage from '../pages/student/InterviewPage';
import ExamReportPage from '../pages/student/ExamReportPage';
import {
  StudentHelpPage,
  StudentHistoryPage,
  StudentMaterialsPage,
  StudentNotificationsPage,
  StudentNotFoundPage,
  StudentProfilePage,
  StudentResultsPage,
  StudentSettingsPage,
} from '../pages/student/StudentPages';

export default function StudentRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={[ROLES.STUDENT]} />}>
        <Route element={<StudentLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboardPage />} />
          <Route path="exams" element={<ExamSchedulePage />} />
          <Route path="exams/:id/readiness" element={<ExamReadinessPage />} />
          <Route path="exams/:id" element={<ExamDetailPage />} />
          <Route path="interview/:id" element={<InterviewPage />} />
          <Route path="exams/:id/room" element={<InterviewPage />} />
          <Route path="reports/:id" element={<ExamReportPage />} />
          <Route path="reports" element={<StudentResultsPage />} />
          <Route path="results" element={<StudentResultsPage />} />
          <Route path="results/:id" element={<ExamReportPage />} />
          <Route path="history" element={<StudentHistoryPage />} />
          <Route path="exam-history" element={<StudentHistoryPage />} />
          <Route path="materials" element={<StudentMaterialsPage />} />
          <Route path="notifications" element={<StudentNotificationsPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="settings" element={<StudentSettingsPage />} />
          <Route path="help" element={<StudentHelpPage />} />
          <Route path="*" element={<StudentNotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
