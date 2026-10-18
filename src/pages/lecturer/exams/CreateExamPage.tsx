import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function CreateExamPage() {
  return <WorkflowPage
    title="Tạo kỳ thi"
    description="Cấu hình kỳ thi vấn đáp trước khi phân công thí sinh."
    category="THIẾT LẬP PHIÊN THI"
    capabilities={[
      'Cần backend xác nhận các trường kỳ thi, môn học, thời lượng và trạng thái.',
      'Cấu hình số câu chính, số câu hỏi thích ứng tối đa và chính sách phân phối câu hỏi.',
      'Tạo phiên thi chỉ khả dụng sau khi service create exam được tích hợp.',
    ]}
    related={[
      { label: 'Danh sách kỳ thi', to: APP_ROUTES.lecturer.exams },
      { label: 'Ngân hàng câu hỏi', to: APP_ROUTES.lecturer.questions },
    ]}
  />;
}
