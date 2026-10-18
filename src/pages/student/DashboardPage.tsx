import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { StudentNotice } from './StudentPages';
import { useLanguage } from '../../context/LanguageContext';
import './StudentDashboard.css';

const shortcuts = [
  { title: 'Lịch thi của tôi', description: 'Kiểm tra lịch được phân công và thông tin kỳ thi.', icon: '▦', to: APP_ROUTES.student.exams },
  { title: 'Lịch sử thi', description: 'Xem lại các phiên thi đã hoàn thành.', icon: '◷', to: APP_ROUTES.student.history },
  { title: 'Kết quả', description: 'Theo dõi kết quả chính thức sau khi giảng viên công bố.', icon: '↗', to: APP_ROUTES.student.results },
  { title: 'Tài liệu học tập', description: 'Mở tài liệu ôn tập được chia sẻ cho bạn.', icon: '▤', to: APP_ROUTES.student.materials },
];

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const name = user?.fullName || user?.username || 'Sinh viên';
  const firstName = name.trim().split(/\s+/).slice(-2).join(' ') || name;

  return (
    <div className="student-dashboard">
      <div className="student-dashboard-columns">
        <div className="student-dashboard-primary">
          <section className="student-welcome-banner">
            <div>
              <span className="student-dashboard-eyebrow">{t('KHÔNG GIAN HỌC TẬP CỦA BẠN')}</span>
              <h1>{t('Xin chào')}, {firstName}!</h1>
              <p>{t('Chuẩn bị tự tin cho kỳ thi vấn đáp tiếp theo của bạn.')}</p>
              <Link to={APP_ROUTES.student.exams}>{t('Mở lịch thi')} <span aria-hidden="true">→</span></Link>
            </div>
            <div className="student-welcome-art" aria-hidden="true">
              <div className="student-orbit orbit-one" />
              <div className="student-orbit orbit-two" />
              <div className="student-assistant">✦</div>
              <span className="student-sound-wave">)))</span>
            </div>
          </section>

          <section className="student-dashboard-section student-data-panel">
            <div className="student-section-heading">
              <div><span className="student-section-kicker">{t('CẬP NHẬT')}</span><h2>{t('Kỳ thi sắp tới')}</h2></div>
              <Link to={APP_ROUTES.student.exams}>{t('Xem lịch thi')} <span aria-hidden="true">→</span></Link>
            </div>
            <StudentNotice title="Chưa thể tải lịch thi">
              {t('Lịch thi sẽ xuất hiện tại đây sau khi dịch vụ backend cung cấp các kỳ thi được phân công cho tài khoản của bạn. Chưa có lịch mẫu hoặc nút vào phòng thi được hiển thị.')}
            </StudentNotice>
          </section>
        </div>

        <aside className="student-dashboard-secondary">
          <section className="student-dashboard-section student-overview-panel">
            <div className="student-section-heading">
              <div><span className="student-section-kicker">{t('TRUY CẬP NHANH')}</span><h2>{t('Tổng quan của bạn')}</h2></div>
            </div>
            <div className="student-shortcut-grid">
              {shortcuts.map((item) => (
                <Link to={item.to} className="student-shortcut-card" key={item.to}>
                  <span className="student-shortcut-icon" aria-hidden="true">{item.icon}</span>
                  <span className="student-shortcut-copy"><strong>{t(item.title)}</strong><small>{t(item.description)}</small></span>
                  <span className="student-shortcut-arrow" aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="student-dashboard-section student-progress-panel">
            <div className="student-section-heading">
              <div><span className="student-section-kicker">{t('KẾT QUẢ')}</span><h2>{t('Tiến độ học tập')}</h2></div>
              <Link to={APP_ROUTES.student.results}>{t('Kết quả')} <span aria-hidden="true">→</span></Link>
            </div>
            <div className="student-dashboard-unavailable">
              <span aria-hidden="true">✧</span>
              <p>{t('Thống kê và điểm số chỉ hiển thị từ kết quả chính thức đã được giảng viên công bố.')}</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
