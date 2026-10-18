import { Link, useParams } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';
import { StudentNotice, StudentPageHeader } from './StudentPages';

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const validId = Boolean(id && /^[\w-]+$/.test(id));

  return (
    <div className="student-page">
      <StudentPageHeader
        title={validId ? 'Chi tiết kỳ thi' : 'Không tìm thấy kỳ thi'}
        description={validId ? `Thông tin kỳ thi ${id} sẽ được hiển thị sau khi tải từ hệ thống.` : 'Mã kỳ thi không hợp lệ.'}
        action={{ label: 'Quay lại lịch thi', to: APP_ROUTES.student.exams }}
      />
      <StudentNotice title={validId ? 'Chưa thể xác nhận kỳ thi' : 'Đường dẫn kỳ thi không hợp lệ'} kind="warning">
        {validId
          ? 'Dịch vụ tải chi tiết và kiểm tra phân công, trạng thái, thời gian thi chưa được triển khai. Không thể xác nhận quyền tham gia hoặc mở phòng thi ở thời điểm này.'
          : 'Hãy chọn kỳ thi từ lịch của bạn thay vì mở một mã không hợp lệ.'}
      </StudentNotice>
      <section className="student-checklist">
        <h2>Trước khi tham gia kỳ thi</h2>
        <ul>
          <li>Kiểm tra hướng dẫn và khung giờ thi do giảng viên cung cấp.</li>
          <li>Chuẩn bị kết nối mạng ổn định và thiết bị có micro.</li>
          <li>Chỉ cấp quyền micro khi hệ thống yêu cầu trong quy trình thi.</li>
        </ul>
        <p className="student-supporting-copy">Các mục trên là hướng dẫn chuẩn bị chung, không thay thế quy định riêng của kỳ thi.</p>
      </section>
      <div className="student-inline-links">
        {validId && <Link to={`/student/exams/${encodeURIComponent(id || '')}/readiness`}>Kiểm tra sẵn sàng</Link>}
        <Link to={APP_ROUTES.student.help}>Xem hướng dẫn và xử lý sự cố</Link>
      </div>
    </div>
  );
}
