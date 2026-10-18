import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function EventLogPage() {
  return <WorkflowPage
    title="Nhật ký sự kiện"
    description="Tra cứu các sự kiện đã được backend ghi nhận trong quá trình thi."
    category="NHẬT KÝ"
    capabilities={[
      'Lọc sự kiện theo kỳ thi, phiên phỏng vấn, thời gian và mức độ.',
      'Hiển thị thời điểm, tác nhân và nguồn dữ liệu theo audit contract.',
      'Nhật ký chỉ xuất hiện khi API monitoring trả về dữ liệu thực.',
    ]}
    related={[
      { label: 'Giám sát phiên thi', to: APP_ROUTES.lecturer.monitoring },
      { label: 'Bản ghi & transcript', to: `${APP_ROUTES.lecturer.monitoring}/recording` },
    ]}
  />;
}
