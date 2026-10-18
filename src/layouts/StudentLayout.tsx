import { APP_ROUTES } from '../constants/routes';
import RoleLayout from './RoleLayout';

const navigation = [
  { to: APP_ROUTES.student.dashboard, label: 'Trang chủ', icon: 'home' },
  { to: APP_ROUTES.student.exams, label: 'Lịch thi của tôi', icon: 'calendar' },
  { to: APP_ROUTES.student.deviceCheck, label: 'Kiểm tra thiết bị', icon: 'settings' },
  { to: APP_ROUTES.student.history, label: 'Lịch sử thi', icon: 'history' },
  { to: APP_ROUTES.student.results, label: 'Kết quả & Báo cáo', icon: 'results' },
  { to: APP_ROUTES.student.materials, label: 'Tài liệu học tập', icon: 'materials' },
  { to: APP_ROUTES.student.notifications, label: 'Thông báo', icon: 'bell' },
];

export default function StudentLayout() {
  return <RoleLayout role="student" roleLabel="Sinh viên" navigation={navigation} />;
}
