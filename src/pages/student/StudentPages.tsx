import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getStudentExamHistory, useMockExams } from '../../services/exam/studentExamAssignmentApi';
import type { StudentExamAssignment } from '../../types/exam';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSetting } from '../../components/common/LanguageSelector';
import './StudentDashboard.css';

type StudentPageHeaderProps = {
  title: string;
  description: string;
  action?: { label: string; to: string };
};

export function StudentPageHeader({ title, description, action }: StudentPageHeaderProps) {
  const { t } = useLanguage();
  return (
    <header className="student-page-heading">
      <div>
        <h1>{t(title)}</h1>
        <p>{t(description)}</p>
      </div>
      {action && <Link className="student-primary-button" to={action.to}>{t(action.label)}</Link>}
    </header>
  );
}

export function StudentNotice({ title, children, kind = 'info' }: { title: string; children: React.ReactNode; kind?: 'info' | 'warning' }) {
  const { t } = useLanguage();
  return (
    <section className={`student-state-card ${kind}`} role="status">
      <span className="student-state-symbol" aria-hidden="true">{kind === 'warning' ? '!' : 'i'}</span>
      <div><h2>{t(title)}</h2><p>{typeof children === 'string' ? t(children) : children}</p></div>
    </section>
  );
}

function StudentEmptyPage({ title, description, message, icon, action }: StudentPageHeaderProps & { message: string; icon: string }) {
  const { t } = useLanguage();
  return (
    <div className="student-page">
      <StudentPageHeader title={title} description={description} action={action} />
      <section className="student-empty-card">
        <span className="student-empty-icon" aria-hidden="true">{icon}</span>
        <h2>{t('Chưa thể tải dữ liệu')}</h2>
        <p>{t(message)}</p>
      </section>
      <StudentNotice title="API chưa được kết nối">
        {t('Kết nối API cho chức năng này chưa được triển khai trong frontend. Hệ thống sẽ hiển thị dữ liệu ở đây khi dịch vụ được cung cấp.')}
      </StudentNotice>
    </div>
  );
}

export function StudentHistoryPage() {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<StudentExamAssignment[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getStudentExamHistory(page, 10).then((result) => {
      if (!active) return;
      setItems(result.content);
      setTotalPages(result.totalPages);
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'Không thể tải lịch sử thi.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [page]);

  const statusLabel = (status: string) => ({
    PENDING: 'Chờ xác nhận',
    SCHEDULED: 'Đã lên lịch',
    IN_PROGRESS: 'Đang diễn ra',
    COMPLETED: 'Đã hoàn thành',
  }[status] ?? status);

  return (
    <div className="student-page student-history-page">
      <StudentPageHeader
        title="Lịch sử thi"
        description="Theo dõi các kỳ thi đã tham gia và trạng thái kết quả."
        action={{ label: 'Xem lịch thi', to: APP_ROUTES.student.exams }}
      />
      {useMockExams && <p className="exam-schedule-mock-label" role="status">{t('Dữ liệu mẫu · Chỉ dùng để xem thử giao diện')}</p>}
      {loading && <section className="student-state-card info" role="status">{t('Đang tải lịch sử thi…')}</section>}
      {error && <StudentNotice title="Không thể tải lịch sử thi" kind="warning">{t(error)}</StudentNotice>}
      {!loading && !error && items.length === 0 && (
        <section className="student-empty-card">
          <span className="student-empty-icon" aria-hidden="true">↺</span>
          <h2>{t('Chưa có lịch sử thi')}</h2>
          <p>{t('Các kỳ thi bạn đã tham gia sẽ hiển thị ở đây.')}</p>
        </section>
      )}
      {!loading && !error && items.length > 0 && (
        <section className="student-history-list" aria-label="Danh sách lịch sử thi">
          {items.map((item) => (
            <article className="student-history-item" key={item.assignmentId}>
              <div>
                <h2>{t(item.sessionName || 'Buổi thi vấn đáp')}</h2>
                <p>{new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'vi-VN', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(item.scheduledTime))}</p>
              </div>
              <span>{t(statusLabel(item.assignmentStatus))}</span>
            </article>
          ))}
        </section>
      )}
      {totalPages > 1 && (
        <nav className="exam-schedule-pagination" aria-label="Phân trang lịch sử thi">
          <button type="button" disabled={page <= 0 || loading} onClick={() => setPage((value) => value - 1)}>{t('Trước')}</button>
          <span>{t('Trang')} {page + 1} / {totalPages}</span>
          <button type="button" disabled={page + 1 >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>{t('Tiếp')}</button>
        </nav>
      )}
    </div>
  );
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
  const { t } = useLanguage();
  return (
    <div className="student-page">
      <StudentPageHeader title="Hồ sơ cá nhân" description="Thông tin tài khoản học sinh đang đăng nhập." />
      <section className="student-profile-card">
        <div className="student-profile-hero">
          <span className="student-profile-large-avatar">{(user?.fullName || user?.username || 'H').charAt(0).toLocaleUpperCase('vi-VN')}</span>
          <div><h2>{user?.fullName || user?.username || t('Chưa có tên hiển thị')}</h2><p>{t('Sinh viên')} · {t('Thông tin tài khoản')}</p></div>
        </div>
        <dl className="student-profile-fields">
          <div><dt>{t('Họ và tên')}</dt><dd>{user?.fullName || user?.username || t('Chưa cập nhật')}</dd></div>
          <div><dt>Email</dt><dd>{user?.email || t('Chưa cập nhật')}</dd></div>
          <div><dt>{t('Mã sinh viên')}</dt><dd>{user?.studentOrStaffCode || t('Chưa có thông tin')}</dd></div>
          <div><dt>{t('Vai trò')}</dt><dd>{t('Sinh viên')}</dd></div>
        </dl>
      </section>
      <StudentNotice title="Chỉ hiển thị thông tin đã xác thực">
        {t('Chỉnh sửa hồ sơ chưa được bật vì chưa có API Student profile trong frontend. Thông tin trên trang này lấy từ phiên đăng nhập hiện tại.')}
      </StudentNotice>
    </div>
  );
}

export function StudentSettingsPage() {
  const { t } = useLanguage();
  return (
    <div className="student-page">
      <StudentPageHeader title="Cài đặt" description="Quản lý tùy chọn tài khoản và trải nghiệm học tập." />
      <section className="student-settings-list">
        <LanguageSetting />
        <div className="student-settings-row">
          <span className="student-setting-icon" aria-hidden="true">
            <svg className="student-setting-icon-svg" viewBox="0 0 24 24" fill="none">
              <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
            </svg>
          </span>
          <span className="student-settings-copy"><strong>{t('Thông báo')}</strong><small>{t('Tùy chọn nhận nhắc lịch và cập nhật kết quả')}</small></span>
          <span className="student-setting-status">{t('Chưa hỗ trợ')}</span>
        </div>
        <div className="student-settings-row">
          <span className="student-setting-icon" aria-hidden="true">
            <svg className="student-setting-icon-svg" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" />
            </svg>
          </span>
          <span className="student-settings-copy"><strong>{t('Mật khẩu')}</strong><small>{t('Thay đổi mật khẩu tài khoản')}</small></span>
          <span className="student-setting-status">{t('Chưa hỗ trợ')}</span>
        </div>
      </section>
      <StudentNotice title="Cài đặt chưa thể lưu">
        {t('Dự án chưa có API lưu tùy chọn Student hoặc đổi mật khẩu; các mục trên đang ở chế độ chỉ xem.')}
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
  const { t } = useLanguage();
  return (
    <div className="student-page">
      <StudentPageHeader title="Trợ giúp" description="Hướng dẫn chuẩn bị và tham gia kỳ thi vấn đáp AI." action={{ label: 'Xem lịch thi', to: APP_ROUTES.student.exams }} />
      <section className="student-faq-list">
        {faqs.map((faq) => <details key={faq.question}><summary>{t(faq.question)}<span aria-hidden="true">+</span></summary><p>{t(faq.answer)}</p></details>)}
      </section>
      <StudentNotice title="Cần hỗ trợ thêm?">
        {t('Hiện chưa có kênh gửi yêu cầu hỗ trợ được tích hợp. Vui lòng trao đổi với giảng viên theo kênh liên lạc của lớp.')}
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
