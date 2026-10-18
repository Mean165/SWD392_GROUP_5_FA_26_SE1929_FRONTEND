import { Link, useSearchParams } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';
import { StudentNotice, StudentPageHeader } from './StudentPages';

export default function ExamSchedulePage() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search')?.trim();

  return (
    <div className="student-page">
      <StudentPageHeader
        title="Lịch thi của tôi"
        description="Xem các kỳ thi vấn đáp được xếp lịch cho tài khoản của bạn."
        action={{ label: 'Về trang chủ', to: APP_ROUTES.student.dashboard }}
      />
      <section className="student-empty-card">
        <span className="student-empty-icon" aria-hidden="true">◷</span>
        <h2>{search ? 'Không thể tìm trong lịch thi hiện tại' : 'Chưa có lịch thi được tải'}</h2>
        <p>{search ? `Đã nhận yêu cầu tìm “${search}”, nhưng chưa thể tra cứu vì hệ thống chưa cung cấp dữ liệu lịch thi.` : 'Lịch thi cần được lấy từ hệ thống để xác nhận môn học, thời gian, trạng thái và quyền tham gia của bạn.'}</p>
      </section>
      <StudentNotice title="Lịch thi chưa được kết nối với backend">
      Frontend hiện chưa có tích hợp API và hợp đồng dữ liệu đã xác nhận để tải các buổi thi được phân công. Vì vậy trang này không hiển thị lịch mẫu hoặc nút vào phòng thi có thể gây nhầm lẫn.
      </StudentNotice>
      <div className="student-inline-links">
        <Link to={APP_ROUTES.student.history}>Mở lịch sử thi</Link>
        <Link to={APP_ROUTES.student.help}>Hướng dẫn chuẩn bị thi</Link>
      </div>
    </div>
  );
}
