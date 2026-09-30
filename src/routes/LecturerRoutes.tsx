import { Route, Routes } from 'react-router-dom';
import { ROLES } from '../constants/roles';
import LecturerLayout from '../layouts/LecturerLayout';
import ProtectedRoute from './ProtectedRoute';
import LecturerDashboardPage from '../pages/lecturer/DashboardPage';
import QuestionBankPage from '../pages/lecturer/questions/QuestionBankPage';
import QuestionDetailPage from '../pages/lecturer/questions/QuestionDetailPage';
import CreateQuestionPage from '../pages/lecturer/questions/CreateQuestionPage';
import EditQuestionPage from '../pages/lecturer/questions/EditQuestionPage';
import ImportQuestionPage from '../pages/lecturer/questions/ImportQuestionPage';
import GenerateQuestionPage from '../pages/lecturer/questions/GenerateQuestionPage';
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

export default function LecturerRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={[ROLES.LECTURER]} />}>
        <Route element={<LecturerLayout />}>
          <Route path="/lecturer/dashboard" element={<LecturerDashboardPage />} />
          <Route path="/lecturer/questions" element={<QuestionBankPage />} />
          <Route path="/lecturer/questions/create" element={<CreateQuestionPage />} />
          <Route path="/lecturer/questions/import" element={<ImportQuestionPage />} />
          <Route path="/lecturer/questions/generate" element={<GenerateQuestionPage />} />
          <Route path="/lecturer/questions/:id" element={<QuestionDetailPage />} />
          <Route path="/lecturer/questions/:id/edit" element={<EditQuestionPage />} />
          <Route path="/lecturer/rubrics" element={<RubricPage />} />
          <Route path="/lecturer/exams" element={<ExamListPage />} />
          <Route path="/lecturer/exams/create" element={<CreateExamPage />} />
          <Route path="/lecturer/exams/:id" element={<ExamDetailPage />} />
          <Route path="/lecturer/exams/:id/schedule" element={<ExamSchedulePage />} />
          <Route path="/lecturer/exams/:id/participants" element={<ExamParticipantsPage />} />
          <Route path="/lecturer/evaluations" element={<EvaluationListPage />} />
          <Route path="/lecturer/evaluations/:id" element={<EvaluationDetailPage />} />
          <Route path="/lecturer/evaluations/:id/review" element={<ScoreReviewPage />} />
          <Route path="/lecturer/monitoring" element={<MonitoringPage />} />
          <Route path="/lecturer/monitoring/recording" element={<RecordingPage />} />
          <Route path="/lecturer/monitoring/event-log" element={<EventLogPage />} />
          <Route path="/lecturer/reports" element={<ClassReportPage />} />
          <Route path="/lecturer/reports/questions" element={<QuestionStatisticsPage />} />
          <Route path="/lecturer/reports/export" element={<GradeExportPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
