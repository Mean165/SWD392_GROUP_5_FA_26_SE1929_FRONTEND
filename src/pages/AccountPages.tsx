import WorkflowPage from '../components/common/WorkflowPage';
import { useAuth } from '../hooks/useAuth';
import './student/StudentDashboard.css';

export function AccountProfilePage({ roleLabel }: { roleLabel: string }) {
  const { user } = useAuth();
  const fullName = user?.fullName || user?.username || 'Chưa cập nhật';

  return (
    <div className="student-page">
      <header className="student-page-heading">
        <div><h1>Hồ sơ cá nhân</h1><p>Thông tin tài khoản trong phiên đăng nhập hiện tại.</p></div>
      </header>
      <section className="student-profile-card">
        <div className="student-profile-hero">
          <span className="student-profile-large-avatar">{fullName.charAt(0).toLocaleUpperCase()}</span>
          <div><h2>{fullName}</h2><p>{roleLabel} · Thông tin tài khoản</p></div>
        </div>
        <dl className="student-profile-fields">
          <div><dt>Họ và tên</dt><dd>{fullName}</dd></div>
          <div><dt>Email</dt><dd>{user?.email || 'Chưa cập nhật'}</dd></div>
          <div><dt>Mã tài khoản</dt><dd>{user?.studentOrStaffCode || 'Chưa có thông tin'}</dd></div>
          <div><dt>Vai trò</dt><dd>{roleLabel}</dd></div>
        </dl>
      </section>
      <WorkflowPage
        title="Quản lý hồ sơ"
        description="Trạng thái cập nhật thông tin cá nhân."
        category="HỒ SƠ"
        capabilities={[
          'Các trường trên được đọc từ thông tin phiên đăng nhập hiện tại.',
          'Frontend chưa có endpoint đã xác nhận để thay đổi thông tin hồ sơ.',
          'Thông tin không có trong phiên được hiển thị là chưa cập nhật, không tự suy diễn.',
        ]}
      />
    </div>
  );
}

export function AccountSettingsPage({ roleLabel }: { roleLabel: string }) {
  return <WorkflowPage
    title="Cài đặt"
    description={`Tùy chọn tài khoản và trải nghiệm ${roleLabel.toLocaleLowerCase('vi-VN')}.`}
    category="TÙY CHỌN TÀI KHOẢN"
    capabilities={[
      'Tùy chọn lưu trữ, bảo mật và thông báo cần API hoặc chính sách ứng dụng được xác nhận.',
      'Không hiển thị điều khiển giả cho chức năng chưa hỗ trợ.',
      'Cấu hình STT/TTS dùng chung, nếu có, chỉ quản trị viên mới được thay đổi qua API tương ứng.',
    ]}
  />;
}
