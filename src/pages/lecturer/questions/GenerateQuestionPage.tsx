import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function GenerateQuestionPage() {
  return <WorkflowPage
    title="Sinh câu hỏi AI / RAG"
    description="Tạo bản nháp câu hỏi từ nguồn học liệu được phép sử dụng."
    category="AI & KHO TRI THỨC"
    capabilities={[
      'Yêu cầu nguồn RAG, phạm vi môn học, mức Bloom và cấu hình sinh câu hỏi.',
      'Mọi kết quả AI phải hiển thị nguồn trích dẫn và ở trạng thái chờ giảng viên duyệt.',
      'Frontend chưa kết nối service sinh câu hỏi; không tạo nội dung AI giả lập.',
    ]}
    related={[
      { label: 'Ngân hàng câu hỏi', to: APP_ROUTES.lecturer.questions },
      { label: 'Duyệt bản nháp AI', to: APP_ROUTES.lecturer.questionReview },
      { label: 'Quản lý rubric', to: APP_ROUTES.lecturer.rubrics },
    ]}
  />;
}
