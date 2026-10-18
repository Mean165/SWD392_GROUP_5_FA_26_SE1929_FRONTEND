import { APP_ROUTES } from '../constants/routes';
import RoleLayout from './RoleLayout';

const navigation = [
  { to: APP_ROUTES.admin.dashboard, label: 'Tổng quan', icon: 'home' },
  { to: APP_ROUTES.admin.users, label: 'Tài khoản & vai trò', icon: 'courses' },
  { to: APP_ROUTES.admin.subjects, label: 'Môn học', icon: 'materials' },
  { to: APP_ROUTES.admin.subjectAssignments, label: 'Phân công giảng viên', icon: 'rubric' },
  { to: APP_ROUTES.admin.auditLogs, label: 'Nhật ký hệ thống', icon: 'history' },
  { to: APP_ROUTES.admin.settings, label: 'Cấu hình hệ thống', icon: 'settings' },
];

export default function AdminLayout() {
  return <RoleLayout role="admin" roleLabel="Quản trị viên" navigation={navigation} />;
}
