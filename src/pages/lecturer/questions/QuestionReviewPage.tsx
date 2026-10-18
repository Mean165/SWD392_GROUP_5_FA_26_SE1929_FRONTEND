import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function QuestionReviewPage() {
  return <WorkflowPage
    title="Duyệt câu hỏi AI"
    description="Rà soát bản nháp AI/RAG, đối chiếu nguồn và phê duyệt trước khi sử dụng."
    category="KIỂM DUYỆT NỘI DUNG"
    capabilities={[
      'Bản nháp cần hiển thị nguồn tài liệu, mức Bloom, rubric và lịch sử chỉnh sửa.',
      'Giảng viên có thể duyệt, sửa hoặc từ chối sau khi API phê duyệt được tích hợp.',
      'Chưa có service tạo hoặc phê duyệt câu hỏi; không có câu hỏi AI giả trong danh sách.',
    ]}
    related={[
      { label: 'Sinh câu hỏi AI / RAG', to: APP_ROUTES.lecturer.questionsGenerate },
      { label: 'Ngân hàng câu hỏi', to: APP_ROUTES.lecturer.questions },
    ]}
  />;
}
