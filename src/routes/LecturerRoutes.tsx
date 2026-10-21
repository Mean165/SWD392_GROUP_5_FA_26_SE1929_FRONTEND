import { Navigate, Route, Routes } from 'react-router-dom';
import { ROLES } from '../constants/roles';
import LecturerLayout from '../layouts/LecturerLayout';
import ProtectedRoute from './ProtectedRoute';
import LecturerDashboardPage from '../pages/lecturer/DashboardPage';
import CoursesPage from '../pages/lecturer/CoursesPage';
import QuestionBankPage from '../pages/lecturer/questions/QuestionBankPage';
import QuestionDetailPage from '../pages/lecturer/questions/QuestionDetailPage';
import EditQuestionPage from '../pages/lecturer/questions/EditQuestionPage';
import GenerateQuestionPage from '../pages/lecturer/questions/GenerateQuestionPage';
import QuestionReviewPage from '../pages/lecturer/questions/QuestionReviewPage';
import RubricPage from '../pages/lecturer/questions/RubricPage';
import ExamListPage from '../pages/lecturer/exams/ExamListPage';
import CreateExamPage from '../pages/lecturer/exams/CreateExamPage';
import ExamDetailPage from '../pages/lecturer/exams/ExamDetailPage';
import ExamSchedulePage from '../pages/lecturer/exams/ExamSchedulePage';
import ExamParticipantsPage from '../pages/lecturer/exams/ExamParticipantsPage';
import EvaluationListPage from '../pages/lecturer/evaluations/EvaluationListPage';
import EvaluationDetailPage from '../pages/lecturer/evaluations/EvaluationDetailPage';
import ScoreReviewPage from '../pages/lecturer/evaluations/ScoreReviewPage';
import MonitoringPage from '../pages/lecturer/monitoring/MonitoringPage';
import RecordingPage from '../pages/lecturer/monitoring/RecordingPage';
import EventLogPage from '../pages/lecturer/monitoring/EventLogPage';
import ClassReportPage from '../pages/lecturer/reports/ClassReportPage';
import QuestionStatisticsPage from '../pages/lecturer/reports/QuestionStatisticsPage';
import GradeExportPage from '../pages/lecturer/reports/GradeExportPage';
import { AccountProfilePage, AccountSettingsPage } from '../pages/AccountPages';

export default function LecturerRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={[ROLES.LECTURER]} />}>
        <Route element={<LecturerLayout />}>
          <Route path="dashboard" element={<LecturerDashboardPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="questions" element={<QuestionBankPage />} />
          <Route path="questions/generate" element={<GenerateQuestionPage />} />
          <Route path="questions/review" element={<QuestionReviewPage />} />
          <Route path="questions/:id" element={<QuestionDetailPage />} />
          <Route path="questions/:id/edit" element={<EditQuestionPage />} />
          <Route path="rubrics" element={<RubricPage />} />
          <Route path="exams" element={<ExamListPage />} />
          <Route path="exams/create" element={<CreateExamPage />} />
          <Route path="exams/:id" element={<ExamDetailPage />} />
          <Route path="exams/:id/schedule" element={<ExamSchedulePage />} />
          <Route path="exams/:id/participants" element={<ExamParticipantsPage />} />
          <Route path="evaluations" element={<EvaluationListPage />} />
          <Route path="evaluations/:id" element={<EvaluationDetailPage />} />
          <Route path="evaluations/:id/review" element={<ScoreReviewPage />} />
          <Route path="monitoring" element={<MonitoringPage />} />
          <Route path="monitoring/recording" element={<RecordingPage />} />
          <Route path="monitoring/event-log" element={<EventLogPage />} />
          <Route path="reports" element={<ClassReportPage />} />
          <Route path="reports/questions" element={<QuestionStatisticsPage />} />
          <Route path="reports/export" element={<GradeExportPage />} />
          <Route path="profile" element={<AccountProfilePage roleLabel="Giảng viên" />} />
          <Route path="settings" element={<AccountSettingsPage roleLabel="giảng viên" />} />
          <Route path="*" element={<Navigate to="/lecturer/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
