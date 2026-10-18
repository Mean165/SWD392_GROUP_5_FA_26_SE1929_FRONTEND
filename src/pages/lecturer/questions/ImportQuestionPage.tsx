import { APP_ROUTES } from '../../../constants/routes';
import WorkflowPage from '../../../components/common/WorkflowPage';

export default function ImportQuestionPage() {
  return <WorkflowPage
    title="Nhập câu hỏi"
    description="Nhập nội dung câu hỏi vào ngân hàng theo định dạng được hệ thống hỗ trợ."
    category="NHẬP DỮ LIỆU"
    capabilities={[
      'Định dạng tệp và quy tắc kiểm tra cần được xác định bởi API nhập câu hỏi.',
      'Kết quả nhập phải báo rõ bản ghi hợp lệ, lỗi và nội dung trùng lặp trước khi xác nhận.',
      'Frontend chưa kết nối service import; không có tệp nào được tải lên.',
    ]}
    related={[{ label: 'Ngân hàng câu hỏi', to: APP_ROUTES.lecturer.questions }]}
  />;
}
