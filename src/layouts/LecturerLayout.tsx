import { APP_ROUTES } from '../constants/routes';
import RoleLayout from './RoleLayout';

const navigation = [
  { to: APP_ROUTES.lecturer.dashboard, label: 'Tổng quan', icon: 'home' },
  { to: APP_ROUTES.lecturer.courses, label: 'Môn học', icon: 'courses' },
  { to: APP_ROUTES.lecturer.exams, label: 'Kỳ thi & lịch thi', icon: 'calendar' },
  { to: APP_ROUTES.lecturer.questions, label: 'Ngân hàng câu hỏi', icon: 'questions' },
  { to: APP_ROUTES.lecturer.rubrics, label: 'Thang điểm', icon: 'rubric' },
  { to: APP_ROUTES.lecturer.evaluations, label: 'Chấm điểm', icon: 'grading' },
  { to: APP_ROUTES.lecturer.monitoring, label: 'Giám sát thi', icon: 'monitoring' },
  { to: APP_ROUTES.lecturer.reports, label: 'Báo cáo', icon: 'reports' },
];

export default function LecturerLayout() {
  return <RoleLayout role="lecturer" roleLabel="Giảng viên" navigation={navigation} />;
}
