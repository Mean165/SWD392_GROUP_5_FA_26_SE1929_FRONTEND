import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function GradeExportPage() {
  return <WorkflowPage
    title="Xuất điểm"
    description="Tải dữ liệu điểm chính thức theo kỳ thi và phạm vi được cấp quyền."
    category="XUẤT DỮ LIỆU"
    capabilities={[
      'Xuất dữ liệu chỉ sau khi đã công bố hoặc phê duyệt theo quy trình.',
      'Định dạng tệp và phạm vi cột cần tuân thủ hợp đồng export backend.',
      'Không tạo hoặc tải xuống tệp điểm giả.',
    ]}
    related={[
      { label: 'Duyệt điểm', to: APP_ROUTES.lecturer.evaluations },
      { label: 'Báo cáo lớp', to: APP_ROUTES.lecturer.reports },
    ]}
  />;
}
