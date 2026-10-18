import { Link, useParams } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';
import { StudentNotice, StudentPageHeader } from './StudentPages';

export default function ExamReportPage() {
  const { id } = useParams<{ id: string }>();
  const validId = Boolean(id && /^[\w-]+$/.test(id));

  return (
    <div className="student-page">
      <StudentPageHeader
        title={validId ? 'Chi tiết kết quả' : 'Không tìm thấy kết quả'}
        description={validId ? `Kết quả ${id}` : 'Mã kết quả không hợp lệ.'}
        action={{ label: 'Kết quả & Báo cáo', to: APP_ROUTES.student.results }}
      />
      <section className="student-result-summary">
        <span className="student-result-lock" aria-hidden="true">✓</span>
        <div>
          <h2>Kết quả chưa được tải</h2>
          <p>Chỉ điểm đã được giảng viên công bố mới hiển thị là kết quả chính thức.</p>
        </div>
      </section>
      <StudentNotice title={validId ? 'Chưa thể hiển thị kết quả kỳ thi' : 'Đường dẫn kết quả không hợp lệ'} kind="warning">
        {validId
          ? 'Frontend chưa có API đọc kết quả Student đã công bố, transcript hoặc nhận xét được phép xem. Không hiển thị điểm AI, điểm nháp hay thông tin của người học khác.'
          : 'Hãy mở kết quả từ danh sách kết quả của chính bạn.'}
      </StudentNotice>
      <div className="student-inline-links">
        <Link to={APP_ROUTES.student.history}>Lịch sử thi</Link>
        <Link to={APP_ROUTES.student.dashboard}>Về trang chủ</Link>
      </div>
    </div>
  );
}
