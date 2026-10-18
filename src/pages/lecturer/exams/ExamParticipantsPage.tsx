import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function ExamParticipantsPage() {
  return <WorkflowPage
    title="Thí sinh kỳ thi"
    description="Phân công người học, quản lý trạng thái tham gia và lịch cá nhân."
    category="PHÂN CÔNG THÍ SINH"
    capabilities={[
      'Tải danh sách thí sinh theo kỳ thi và kiểm tra phân công hiện tại.',
      'Phân công hoặc gỡ người học chỉ sau khi quyền và API được xác nhận.',
      'Trạng thái tham gia và điểm không được suy đoán từ phía trình duyệt.',
    ]}
    related={[{ label: 'Danh sách kỳ thi', to: APP_ROUTES.lecturer.exams }]}
  />;
}
