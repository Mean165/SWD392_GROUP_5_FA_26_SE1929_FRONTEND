import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function EvaluationListPage() {
  return <WorkflowPage
    title="Hàng đợi chấm điểm"
    description="Theo dõi các bài thi cần giảng viên rà soát và hoàn tất đánh giá."
    category="ĐÁNH GIÁ"
    capabilities={[
      'Lọc bài làm theo kỳ thi, trạng thái chấm và ngày nộp.',
      'Phân biệt rõ gợi ý điểm AI với điểm cuối cùng do giảng viên xác nhận.',
      'Chỉ dữ liệu đánh giá thực tế từ dịch vụ mới được hiển thị.',
    ]}
    related={[
      { label: 'Giám sát thi', to: APP_ROUTES.lecturer.monitoring },
      { label: 'Báo cáo lớp', to: APP_ROUTES.lecturer.reports },
    ]}
  />;
}
