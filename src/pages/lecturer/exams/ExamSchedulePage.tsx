import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function ExamSchedulePage() {
  return <WorkflowPage
    title="Lịch thi"
    description="Xếp khung giờ thi cho từng thí sinh và rà soát lịch phiên."
    category="LỊCH THI"
    capabilities={[
      'Đọc lịch đã phân công từ dịch vụ backend và hiển thị múi giờ rõ ràng.',
      'Tạo hoặc cập nhật khung giờ, phòng thi và hình thức tổ chức theo quyền.',
      'Không cho phép vào phòng thi ngoài thời gian và trạng thái được backend xác nhận.',
    ]}
    related={[{ label: 'Danh sách kỳ thi', to: APP_ROUTES.lecturer.exams }]}
  />;
}
