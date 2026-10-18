import { useParams } from 'react-router-dom';
import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <WorkflowPage
    title="Chi tiết kỳ thi"
    description="Xem cấu hình, trạng thái và các thao tác quản lý phiên thi."
    category="TỔ CHỨC THI"
    capabilities={[
      'Tải dữ liệu và quyền quản lý kỳ thi theo mã từ backend trước khi hiển thị.',
      'Từ trang chi tiết có thể quản lý lịch thi và danh sách thí sinh.',
      'Không thể xác nhận trạng thái hoặc chỉnh sửa kỳ thi khi API chưa sẵn sàng.',
    ]}
    related={[
      { label: 'Tất cả kỳ thi', to: APP_ROUTES.lecturer.exams },
      ...(id ? [
        { label: 'Quản lý lịch thi', to: `${APP_ROUTES.lecturer.exams}/${encodeURIComponent(id)}/schedule` },
        { label: 'Phân công thí sinh', to: `${APP_ROUTES.lecturer.exams}/${encodeURIComponent(id)}/participants` },
      ] : []),
    ]}
  />;
}
