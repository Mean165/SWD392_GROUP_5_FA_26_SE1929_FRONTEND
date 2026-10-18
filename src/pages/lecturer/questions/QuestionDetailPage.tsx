import { useParams } from 'react-router-dom';
import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <WorkflowPage
    title="Chi tiết câu hỏi"
    description="Xem nội dung, mức Bloom, rubric và trạng thái phê duyệt."
    category="NGÂN HÀNG CÂU HỎI"
    capabilities={[
      'Chi tiết chỉ được hiển thị sau khi tải dữ liệu câu hỏi từ backend.',
      'Trạng thái phê duyệt và nguồn tài liệu RAG phải được xác thực từ hệ thống.',
      'Không hiển thị nội dung mẫu hoặc khẳng định câu hỏi đã được duyệt.',
    ]}
    related={[
      { label: 'Ngân hàng câu hỏi', to: APP_ROUTES.lecturer.questions },
      ...(id ? [{ label: 'Chỉnh sửa câu hỏi', to: `${APP_ROUTES.lecturer.questions}/${encodeURIComponent(id)}/edit` }] : []),
    ]}
  />;
}
