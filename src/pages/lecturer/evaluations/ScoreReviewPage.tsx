import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function ScoreReviewPage() {
  return <WorkflowPage
    title="Duyệt điểm cuối cùng"
    description="Giảng viên xem xét đánh giá và xác nhận kết quả chính thức."
    category="PHÊ DUYỆT CỦA GIẢNG VIÊN"
    capabilities={[
      'So sánh rubric, câu trả lời và điểm AI gợi ý (nếu dịch vụ có cung cấp).',
      'Cho phép giảng viên chỉnh sửa và lưu điểm cuối cùng qua endpoint được xác nhận.',
      'Không hiển thị điểm gợi ý như điểm đã công bố hoặc tự phê duyệt kết quả.',
    ]}
    related={[{ label: 'Hàng đợi chấm điểm', to: APP_ROUTES.lecturer.evaluations }]}
  />;
}
