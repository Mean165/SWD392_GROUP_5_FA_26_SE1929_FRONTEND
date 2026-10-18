import { APP_ROUTES } from '../../constants/routes';
import WorkflowPage from '../../components/common/WorkflowPage';

export default function CoursesPage() {
  return <WorkflowPage
    title="Môn học được phân công"
    description="Xem các môn học và nhóm lớp được gán cho giảng viên."
    category="GIẢNG DẠY"
    capabilities={[
      'Danh sách môn học cần tải theo tài khoản giảng viên đang đăng nhập.',
      'Thông tin phân công được quản trị viên quản lý; giảng viên không thể tự sửa phân công.',
      'Frontend chưa kết nối API môn học dành cho giảng viên.',
    ]}
    related={[
      { label: 'Ngân hàng câu hỏi', to: APP_ROUTES.lecturer.questions },
      { label: 'Kỳ thi & lịch thi', to: APP_ROUTES.lecturer.exams },
    ]}
  />;
}
