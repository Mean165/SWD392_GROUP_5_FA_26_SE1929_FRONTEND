import { APP_ROUTES } from '../../constants/routes';
import WorkflowPage from '../../components/common/WorkflowPage';

export default function SubjectsPage() {
  return <WorkflowPage
    title="Môn học"
    description="Quản lý danh mục môn học và thông tin học thuật."
    category="DANH MỤC HỌC THUẬT"
    capabilities={[
      'Danh sách và chi tiết môn học cần được tải từ API quản lý môn học.',
      'Tạo, cập nhật hoặc lưu thay đổi chỉ khả dụng khi service subject được triển khai.',
      'Không hiển thị môn học ví dụ như dữ liệu thật.',
    ]}
    related={[{ label: 'Phân công giảng viên', to: APP_ROUTES.admin.subjectAssignments }]}
  />;
}
