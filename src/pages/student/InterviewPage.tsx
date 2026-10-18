import { Link, useParams } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';
import { StudentNotice, StudentPageHeader } from './StudentPages';

export default function InterviewPage() {
  const { id } = useParams<{ id: string }>();
  const validId = Boolean(id && /^[\w-]+$/.test(id));

  return (
    <div className="student-page">
      <StudentPageHeader
        title="Phòng thi vấn đáp AI"
        description={validId ? `Phiên thi ${id}` : 'Mã phiên thi không hợp lệ.'}
        action={{ label: 'Quay lại lịch thi', to: APP_ROUTES.student.exams }}
      />
      <section className="interview-unavailable">
        <span className="interview-unavailable-icon" aria-hidden="true">AI</span>
        <h2>{validId ? 'Phòng thi chưa khả dụng' : 'Không tìm thấy phiên thi'}</h2>
        <p>
          {validId
            ? 'Các API bắt đầu phiên thi, lấy câu hỏi, ghi âm, gửi câu trả lời và nhận phản hồi AI chưa được kết nối. Để bảo vệ bài thi, micro chưa được yêu cầu và không có câu trả lời nào được giả lập.'
            : 'Không thể tải phiên thi vì đường dẫn không hợp lệ.'}
        </p>
        <div className="interview-room-status"><span /> Kết nối phòng thi chưa được thiết lập</div>
        <Link className="student-primary-button" to={APP_ROUTES.student.help}>Xem hướng dẫn xử lý sự cố</Link>
      </section>
      <StudentNotice title="Không ghi âm hoặc nộp bài khi dịch vụ chưa sẵn sàng" kind="warning">
        Bản frontend hiện không thể xác minh lịch thi, thời gian được phép vào phòng, trạng thái câu hỏi hoặc lưu trữ bản ghi âm. Hãy quay lại sau khi hệ thống thi được tích hợp.
      </StudentNotice>
    </div>
  );
}
