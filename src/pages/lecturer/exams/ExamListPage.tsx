import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function ExamListPage() {
  return <WorkflowPage
    title="Kỳ thi & lịch thi"
    description="Quản lý phiên thi vấn đáp, lịch tổ chức và danh sách thí sinh."
    category="TỔ CHỨC THI"
    capabilities={[
      'Tải các kỳ thi hiện có và lọc theo môn học, trạng thái hoặc thời gian.',
      'Tạo phiên thi, cấu hình thời lượng, số câu chính và giới hạn câu hỏi theo dõi.',
      'Chỉ cho phép thí sinh tham gia theo trạng thái kỳ thi và khung giờ được phân công.',
    ]}
    related={[
      { label: 'Tạo kỳ thi', to: APP_ROUTES.lecturer.examCreate },
      { label: 'Rubric & tiêu chí chấm', to: APP_ROUTES.lecturer.rubrics },
    ]}
  />;
}
