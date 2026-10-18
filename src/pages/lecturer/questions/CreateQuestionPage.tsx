import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function CreateQuestionPage() {
  return <WorkflowPage
    title="Tạo câu hỏi"
    description="Chuẩn bị câu hỏi vấn đáp mới cho ngân hàng câu hỏi."
    category="SOẠN THỦ CÔNG"
    capabilities={[
      'Một câu hỏi chính xác cần có nội dung, môn học, mức Bloom và tiêu chí chấm phù hợp.',
      'Câu hỏi chỉ trở thành nội dung chính thức sau khi được lưu thành công qua API.',
      'Không có form lưu giả khi service tạo câu hỏi chưa được triển khai.',
    ]}
    related={[
      { label: 'Quay lại ngân hàng câu hỏi', to: APP_ROUTES.lecturer.questions },
      { label: 'Quản lý rubric', to: APP_ROUTES.lecturer.rubrics },
    ]}
  />;
}
