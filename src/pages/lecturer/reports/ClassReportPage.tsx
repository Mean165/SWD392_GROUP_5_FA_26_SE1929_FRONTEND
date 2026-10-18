import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function ClassReportPage() {
  return <WorkflowPage
    title="Báo cáo lớp"
    description="Tổng hợp tiến độ thi và kết quả đã được giảng viên phê duyệt."
    category="BÁO CÁO"
    capabilities={[
      'Báo cáo chỉ sử dụng điểm cuối cùng đã được giảng viên xác nhận.',
      'Không gộp điểm AI gợi ý vào kết quả chính thức.',
      'Tổng hợp cần endpoint báo cáo lớp và quyền truy cập tương ứng.',
    ]}
    related={[
      { label: 'Thống kê câu hỏi', to: `${APP_ROUTES.lecturer.reports}/questions` },
      { label: 'Xuất điểm', to: `${APP_ROUTES.lecturer.reports}/export` },
    ]}
  />;
}
