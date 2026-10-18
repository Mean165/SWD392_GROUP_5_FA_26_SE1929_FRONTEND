import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import './StudentDashboard.css';

type StudentPageHeaderProps = {
  title: string;
  description: string;
  action?: { label: string; to: string };
};

export function StudentPageHeader({ title, description, action }: StudentPageHeaderProps) {
  return (
    <header className="student-page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <Link className="student-primary-button" to={action.to}>{action.label}</Link>}
    </header>
  );
}

export function StudentNotice({ title, children, kind = 'info' }: { title: string; children: React.ReactNode; kind?: 'info' | 'warning' }) {
  return (
    <section className={`student-state-card ${kind}`} role="status">
      <span className="student-state-symbol" aria-hidden="true">{kind === 'warning' ? '!' : 'i'}</span>
      <div><h2>{title}</h2><p>{children}</p></div>
    </section>
  );
}

function StudentEmptyPage({ title, description, message, icon, action }: StudentPageHeaderProps & { message: string; icon: string }) {
  return (
    <div className="student-page">
      <StudentPageHeader title={title} description={description} action={action} />
      <section className="student-empty-card">
        <span className="student-empty-icon" aria-hidden="true">{icon}</span>
        <h2>Chưa thể tải dữ liệu</h2>
        <p>{message}</p>
      </section>
      <StudentNotice title="API chưa được kết nối">
        Kết nối API cho chức năng này chưa được triển khai trong frontend. Hệ thống sẽ hiển thị dữ liệu ở đây khi dịch vụ được cung cấp.
      </StudentNotice>
    </div>
  );
}

export function StudentHistoryPage() {
  return <StudentEmptyPage title="Lịch sử thi" description="Theo dõi các kỳ thi đã tham gia và trạng thái kết quả." icon="↺" message="Lịch sử thi chưa được tải. Frontend hiện chưa có endpoint đã xác nhận để đọc các phiên thi của tài khoản này." action={{ label: 'Xem lịch thi', to: APP_ROUTES.student.exams }} />;
}

export function StudentResultsPage() {
  return <StudentEmptyPage title="Kết quả & Báo cáo" description="Xem điểm đã công bố và tiến độ học tập theo thời gian." icon="⌁" message="Chưa thể tải danh sách kết quả đã công bố. Điểm AI, điểm trung bình và biểu đồ sẽ chỉ xuất hiện khi có dữ liệu chính thức được cung cấp." action={{ label: 'Lịch sử thi', to: APP_ROUTES.student.history }} />;
}

export function StudentMaterialsPage() {
  return <StudentEmptyPage title="Tài liệu học tập" description="Tài liệu ôn tập được chia sẻ cho các môn học của bạn." icon="▤" message="Tài liệu chưa được tải. Chưa có dịch vụ tài liệu học tập được kết nối trong frontend." />;
}

export function StudentNotificationsPage() {
  return <StudentEmptyPage title="Thông báo" description="Nhắc lịch thi, kết quả mới và phản hồi từ giảng viên." icon="♧" message="Thông báo chưa được tải vì frontend chưa có dịch vụ thông báo được kết nối." />;
}

export function StudentProfilePage() {
  const { user } = useAuth();
  return (
    <div className="student-page">
      <StudentPageHeader title="Hồ sơ cá nhân" description="Thông tin tài khoản học sinh đang đăng nhập." />
      <section className="student-profile-card">
        <div className="student-profile-hero">
          <span className="student-profile-large-avatar">{(user?.fullName || user?.username || 'H').charAt(0).toLocaleUpperCase('vi-VN')}</span>
          <div><h2>{user?.fullName || user?.username || 'Chưa có tên hiển thị'}</h2><p>Sinh viên · Thông tin tài khoản</p></div>
        </div>
        <dl className="student-profile-fields">
          <div><dt>Họ và tên</dt><dd>{user?.fullName || user?.username || 'Chưa cập nhật'}</dd></div>
          <div><dt>Email</dt><dd>{user?.email || 'Chưa cập nhật'}</dd></div>
          <div><dt>Mã sinh viên</dt><dd>{user?.studentOrStaffCode || 'Chưa có thông tin'}</dd></div>
          <div><dt>Vai trò</dt><dd>Sinh viên</dd></div>
        </dl>
      </section>
      <StudentNotice title="Chỉ hiển thị thông tin đã xác thực">
        Chỉnh sửa hồ sơ chưa được bật vì chưa có API Student profile trong frontend. Thông tin trên trang này lấy từ phiên đăng nhập hiện tại.
      </StudentNotice>
    </div>
  );
}

export function StudentSettingsPage() {
  return (
    <div className="student-page">
      <StudentPageHeader title="Cài đặt" description="Quản lý tùy chọn tài khoản và trải nghiệm học tập." />
      <section className="student-settings-list">
        <div><span className="student-setting-icon">文</span><span><strong>Ngôn ngữ</strong><small>Tiếng Việt</small></span><span className="student-setting-status">Mặc định</span></div>
        <div><span className="student-setting-icon">♧</span><span><strong>Thông báo</strong><small>Tùy chọn nhận nhắc lịch và cập nhật kết quả</small></span><span className="student-setting-status">Chưa hỗ trợ</span></div>
        <div><span className="student-setting-icon">♙</span><span><strong>Mật khẩu</strong><small>Thay đổi mật khẩu tài khoản</small></span><span className="student-setting-status">Chưa hỗ trợ</span></div>
      </section>
      <StudentNotice title="Cài đặt chưa thể lưu">
        Dự án chưa có API lưu tùy chọn Student hoặc đổi mật khẩu; các mục trên đang ở chế độ chỉ xem.
      </StudentNotice>
    </div>
  );
}

const faqs = [
  { question: 'Làm thế nào để chuẩn bị cho kỳ thi vấn đáp?', answer: 'Kiểm tra lịch thi và hướng dẫn của giảng viên, chuẩn bị thiết bị có micro, chọn nơi yên tĩnh và đăng nhập trước giờ thi.' },
  { question: 'Trình duyệt cần quyền micro khi nào?', answer: 'Chỉ cấp quyền micro khi vào phòng thi và bắt đầu bước kiểm tra thiết bị. Không cấp quyền nếu bạn chưa sẵn sàng ghi âm.' },
  { question: 'Nếu mất kết nối hoặc micro không hoạt động thì sao?', answer: 'Kiểm tra lại kết nối mạng và quyền micro trong cài đặt trình duyệt. Nếu sự cố vẫn tiếp diễn, quay lại trang chi tiết kỳ thi và làm theo hướng dẫn của giảng viên.' },
  { question: 'Điểm AI có phải là điểm chính thức không?', answer: 'Không. Đánh giá AI chỉ là gợi ý khi được cung cấp. Điểm chính thức là điểm đã được giảng viên xác nhận và công bố.' },
];

export function StudentHelpPage() {
  return (
    <div className="student-page">
      <StudentPageHeader title="Trợ giúp" description="Hướng dẫn chuẩn bị và tham gia kỳ thi vấn đáp AI." action={{ label: 'Xem lịch thi', to: APP_ROUTES.student.exams }} />
      <section className="student-faq-list">
        {faqs.map((faq) => <details key={faq.question}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}
      </section>
      <StudentNotice title="Cần hỗ trợ thêm?">
        Hiện chưa có kênh gửi yêu cầu hỗ trợ được tích hợp. Vui lòng trao đổi với giảng viên theo kênh liên lạc của lớp.
      </StudentNotice>
    </div>
  );
}

export function StudentNotFoundPage() {
  return (
    <div className="student-page">
      <StudentPageHeader title="Không tìm thấy trang" description="Đường dẫn này không thuộc khu vực học sinh." action={{ label: 'Về trang chủ', to: APP_ROUTES.student.dashboard }} />
      <StudentNotice title="Đường dẫn không hợp lệ" kind="warning">Kiểm tra lại địa chỉ hoặc chọn một mục từ thanh điều hướng.</StudentNotice>
    </div>
  );
}
