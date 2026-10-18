import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function QuestionBankPage() {
  return <WorkflowPage
    title="Ngân hàng câu hỏi"
    description="Quản lý câu hỏi vấn đáp, mức độ Bloom và rubric liên quan."
    category="CÂU HỎI & RUBRIC"
    capabilities={[
      'Tìm kiếm, phân loại và xem chi tiết câu hỏi khi API ngân hàng câu hỏi được cung cấp.',
      'Soạn, chỉnh sửa, xóa hoặc nhập câu hỏi qua các luồng riêng.',
      'Duyệt thủ công mọi nội dung AI/RAG trước khi đưa vào ngân hàng chính thức.',
    ]}
    related={[
      { label: 'Tạo câu hỏi thủ công', to: APP_ROUTES.lecturer.questionCreate },
      { label: 'Nhập câu hỏi', to: APP_ROUTES.lecturer.questionsImport },
      { label: 'Sinh câu hỏi AI / RAG', to: APP_ROUTES.lecturer.questionsGenerate },
      { label: 'Duyệt bản nháp AI', to: APP_ROUTES.lecturer.questionReview },
      { label: 'Quản lý rubric', to: APP_ROUTES.lecturer.rubrics },
    ]}
  />;
}
