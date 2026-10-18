import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function RubricPage() {
  return <WorkflowPage
    title="Quản lý thang điểm"
    description="Thiết kế tiêu chí và thang điểm cho phần thi vấn đáp."
    category="RUBRIC ĐÁNH GIÁ"
    capabilities={[
      'Cấu hình tiêu chí, mô tả mức đạt và trọng số theo hợp đồng rubric của backend.',
      'Liên kết rubric với câu hỏi và bảo toàn phiên bản đã dùng trong kỳ thi.',
      'Không thể tạo hoặc sửa rubric cho đến khi các service rubric được kết nối.',
    ]}
    related={[
      { label: 'Ngân hàng câu hỏi', to: APP_ROUTES.lecturer.questions },
      { label: 'Tạo kỳ thi', to: APP_ROUTES.lecturer.examCreate },
    ]}
  />;
}
