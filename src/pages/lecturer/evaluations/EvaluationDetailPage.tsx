import { useParams } from 'react-router-dom';
import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function EvaluationDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <WorkflowPage
    title="Chi tiết bài đánh giá"
    description="Rà soát câu trả lời, transcript, rubric và gợi ý AI cho một phiên thi."
    category="ĐÁNH GIÁ"
    capabilities={[
      'Hiển thị transcript hoặc bản ghi chỉ khi backend cấp quyền truy cập.',
      'Gợi ý AI được gắn nhãn rõ và không được coi là điểm chính thức.',
      'Điểm cuối cùng chỉ được công nhận sau thao tác phê duyệt có lưu từ giảng viên.',
    ]}
    related={[
      { label: 'Hàng đợi chấm điểm', to: APP_ROUTES.lecturer.evaluations },
      ...(id ? [{ label: 'Duyệt điểm cuối cùng', to: `${APP_ROUTES.lecturer.evaluations}/${encodeURIComponent(id)}/review` }] : []),
    ]}
  />;
}
