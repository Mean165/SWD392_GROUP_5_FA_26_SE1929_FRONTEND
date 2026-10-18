import WorkflowPage from '../components/common/WorkflowPage';
import { LanguageSetting } from '../components/common/LanguageSelector';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import './student/StudentDashboard.css';

export function AccountProfilePage({ roleLabel }: { roleLabel: string }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const fullName = user?.fullName || user?.username || 'Chưa cập nhật';

  return (
    <div className="student-page">
      <header className="student-page-heading">
        <div><h1>{t('Hồ sơ cá nhân')}</h1><p>{t('Thông tin tài khoản trong phiên đăng nhập hiện tại.')}</p></div>
      </header>
      <section className="student-profile-card">
        <div className="student-profile-hero">
          <span className="student-profile-large-avatar">{fullName.charAt(0).toLocaleUpperCase()}</span>
          <div><h2>{fullName}</h2><p>{t(roleLabel)} · {t('Thông tin tài khoản')}</p></div>
        </div>
        <dl className="student-profile-fields">
          <div><dt>{t('Họ và tên')}</dt><dd>{fullName}</dd></div>
          <div><dt>Email</dt><dd>{user?.email || t('Chưa cập nhật')}</dd></div>
          <div><dt>{t('Mã tài khoản')}</dt><dd>{user?.studentOrStaffCode || t('Chưa có thông tin')}</dd></div>
          <div><dt>{t('Vai trò')}</dt><dd>{t(roleLabel)}</dd></div>
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

export function AccountSettingsPage({ roleLabel: _roleLabel }: { roleLabel: string }) {
  const { t } = useLanguage();
  const description = t('Quản lý tùy chọn tài khoản và trải nghiệm học tập.');
  return (
    <div className="student-page">
      <header className="student-page-heading">
        <div><h1>{t('Cài đặt')}</h1><p>{description}</p></div>
      </header>
      <section className="student-settings-list">
        <LanguageSetting />
      </section>
      <WorkflowPage
        title="Cài đặt"
        description={description}
        category="TÙY CHỌN TÀI KHOẢN"
        capabilities={[
          'Tùy chọn lưu trữ, bảo mật và thông báo cần API hoặc chính sách ứng dụng được xác nhận.',
          'Không hiển thị điều khiển giả cho chức năng chưa hỗ trợ.',
          'Cấu hình STT/TTS dùng chung, nếu có, chỉ quản trị viên mới được thay đổi qua API tương ứng.',
        ]}
      />
    </div>
  );
}
