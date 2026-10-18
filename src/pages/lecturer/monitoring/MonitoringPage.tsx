import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function MonitoringPage() {
  return <WorkflowPage
    title="Giám sát phiên thi"
    description="Theo dõi phiên đang diễn ra và điều tra sự cố dựa trên dữ liệu hệ thống."
    category="GIÁM SÁT"
    capabilities={[
      'Trạng thái trực tiếp cần nguồn sự kiện hoặc polling được backend hỗ trợ.',
      'Theo dõi sự kiện thi theo phạm vi kỳ thi và quyền của giảng viên.',
      'Không hiển thị trạng thái kết nối hoặc sự kiện giả lập.',
    ]}
    related={[
      { label: 'Nhật ký sự kiện', to: `${APP_ROUTES.lecturer.monitoring}/event-log` },
      { label: 'Bản ghi phiên thi', to: `${APP_ROUTES.lecturer.monitoring}/recording` },
    ]}
  />;
}
