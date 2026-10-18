import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function RecordingPage() {
  return <WorkflowPage
    title="Bản ghi & transcript"
    description="Rà soát bản ghi và nội dung nhận dạng cho phiên thi được phép truy cập."
    category="BẰNG CHỨNG PHIÊN THI"
    capabilities={[
      'Tải metadata, quyền xem và URL phát lại an toàn từ backend.',
      'Transcript phải được gắn với đúng câu hỏi và mốc thời gian của phiên.',
      'Không hiển thị bản ghi hoặc transcript mẫu khi API chưa có.',
    ]}
    related={[
      { label: 'Giám sát phiên thi', to: APP_ROUTES.lecturer.monitoring },
      { label: 'Nhật ký sự kiện', to: `${APP_ROUTES.lecturer.monitoring}/event-log` },
    ]}
  />;
}
