import { APP_ROUTES } from '../../constants/routes';
import WorkflowPage from '../../components/common/WorkflowPage';

export default function SubjectAssignmentsPage() {
  return <WorkflowPage
    title="Phân công giảng viên"
    description="Quản lý mối liên kết giảng viên và môn học."
    category="PHÂN CÔNG"
    capabilities={[
      'Tải danh sách giảng viên và môn học trước khi tạo liên kết.',
      'Service phân công hiện chưa kết nối; không ghi nhận thao tác phân công giả.',
      'Quyền thay đổi phân công phải được kiểm tra bởi backend.',
    ]}
    related={[
      { label: 'Quản lý tài khoản', to: APP_ROUTES.admin.users },
      { label: 'Danh mục môn học', to: APP_ROUTES.admin.subjects },
    ]}
  />;
}
