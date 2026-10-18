import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function QuestionStatisticsPage() {
  return <WorkflowPage
    title="Thống kê câu hỏi"
    description="Theo dõi mức độ sử dụng và hiệu quả câu hỏi trong các kỳ thi."
    category="PHÂN TÍCH CÂU HỎI"
    capabilities={[
      'Tổng hợp theo môn học, kỳ thi, mức Bloom và phiên bản câu hỏi.',
      'Chỉ sử dụng dữ liệu đánh giá đã được phê duyệt.',
      'Frontend chưa kết nối endpoint thống kê câu hỏi.',
    ]}
    related={[
      { label: 'Ngân hàng câu hỏi', to: APP_ROUTES.lecturer.questions },
      { label: 'Báo cáo lớp', to: APP_ROUTES.lecturer.reports },
    ]}
  />;
}
