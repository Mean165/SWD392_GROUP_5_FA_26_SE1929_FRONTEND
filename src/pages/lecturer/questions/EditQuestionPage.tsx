import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function EditQuestionPage() {
  return <WorkflowPage
    title="Chỉnh sửa câu hỏi"
    description="Rà soát nội dung, phân loại và rubric của câu hỏi đã chọn."
    category="NGÂN HÀNG CÂU HỎI"
    capabilities={[
      'Cần tải câu hỏi theo mã và xác nhận quyền sửa trước khi hiển thị dữ liệu.',
      'Lưu thay đổi yêu cầu endpoint cập nhật câu hỏi; frontend hiện chưa kết nối endpoint đó.',
      'Nội dung AI được giữ ở trạng thái bản nháp cho đến khi giảng viên duyệt.',
    ]}
    related={[{ label: 'Ngân hàng câu hỏi', to: APP_ROUTES.lecturer.questions }]}
  />;
}
