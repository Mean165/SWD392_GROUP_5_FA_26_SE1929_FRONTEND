import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';
import {
  getStudentExamAssignments,
  getStudentExamEligibility,
  useMockExams,
} from '../../services/exam/studentExamAssignmentApi';
import type { ExamEntryEligibility, StudentExamAssignment } from '../../types/exam';
import { useLanguage } from '../../context/LanguageContext';
import { StudentNotice, StudentPageHeader } from './StudentPages';

const dateInputValue = (date: Date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

const statusLabels: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  SCHEDULED: 'Đã lên lịch',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Đã hoàn thành',
};

const formatDateTime = (value: string | null | undefined, language: 'vi' | 'en') => {
  if (!value) return language === 'en' ? 'Not specified' : 'Chưa xác định';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? language === 'en' ? 'Not specified' : 'Chưa xác định'
    : new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'vi-VN', { dateStyle: 'long', timeStyle: 'short' }).format(date);
};

const formatWindow = (eligibility: ExamEntryEligibility, language: 'vi' | 'en') => {
  const lines = [
    eligibility.opensAt ? `${language === 'en' ? 'Opens at' : 'Mở lúc'} ${formatDateTime(eligibility.opensAt, language)}.` : '',
    eligibility.closesAt ? `${language === 'en' ? 'Closes at' : 'Đóng lúc'} ${formatDateTime(eligibility.closesAt, language)}.` : '',
  ];
  return lines.filter(Boolean).join(' ');
};

export default function ExamSchedulePage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const today = new Date();
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const [from, setFrom] = useState(dateInputValue(today));
  const [to, setTo] = useState(dateInputValue(thirtyDaysLater));
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<StudentExamAssignment[]>([]);
  const [eligibility, setEligibility] = useState<Record<string, ExamEntryEligibility | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const loadAssignments = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await getStudentExamAssignments({ from, to, status: status || undefined, page, size: 10 });
        if (!active) return;
        setItems(result.content);
        setTotalPages(result.totalPages);
        setEligibility({});
        const checks = await Promise.all(result.content.map(async (item) => {
          try {
            const access = await getStudentExamEligibility(item.assignmentId);
            return [item.assignmentId, access] as const;
          } catch {
            return [item.assignmentId, null] as const;
          }
        }));
        if (active) setEligibility(Object.fromEntries(checks));
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Không thể tải lịch thi.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadAssignments();
    return () => { active = false; };
  }, [from, to, status, page, reloadKey]);

  const enterRoom = (assignment: StudentExamAssignment) => {
    navigate(`/student/exams/${encodeURIComponent(assignment.sessionId)}/room`);
  };

  return (
    <div className="student-page exam-schedule-page">
      <StudentPageHeader
        title="Lịch thi của tôi"
        description="Xem các kỳ thi được xếp lịch và trạng thái đủ điều kiện vào phòng thi."
      />
      <div className="exam-schedule-actions">
        <Link className="student-primary-button" to={APP_ROUTES.student.deviceCheck}>{t('Kiểm tra thiết bị')}</Link>
        <Link className="exam-schedule-home-link" to={APP_ROUTES.student.dashboard}>{t('Về trang chủ')}</Link>
      </div>
      {useMockExams && <p className="exam-schedule-mock-label" role="status">{t('Dữ liệu mẫu · Chỉ dùng để xem thử giao diện')}</p>}
      {!sessionStorage.getItem('deviceCheckPassedAt') && (
        <StudentNotice title="Bạn có thể kiểm tra thiết bị trước giờ thi">
          {t('Hãy kiểm tra micro, loa và ghi âm thử. Đây chỉ là lời nhắc; chưa kiểm tra thiết bị vẫn có thể yêu cầu vào phòng thi.')}
        </StudentNotice>
      )}

      <form className="exam-schedule-filters" onSubmit={(event) => event.preventDefault()}>
        <label>
          {t('Từ ngày')}
          <input type="date" value={from} max={to} onChange={(event) => { setFrom(event.target.value); setPage(0); }} />
        </label>
        <label>
          {t('Đến ngày')}
          <input type="date" value={to} min={from} onChange={(event) => { setTo(event.target.value); setPage(0); }} />
        </label>
        <label>
          {t('Trạng thái')}
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }}>
            <option value="">{t('Tất cả trạng thái')}</option>
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
          </select>
        </label>
      </form>

      {error && (
        <StudentNotice title="Không thể tải lịch thi" kind="warning">
          {error}{' '}
          <button type="button" className="exam-schedule-retry" onClick={() => setReloadKey((value) => value + 1)}>{t('Thử lại')}</button>
        </StudentNotice>
      )}
      {loading && <section className="student-state-card info" role="status">{t('Đang tải lịch thi…')}</section>}
      {!loading && !error && items.length === 0 && (
        <section className="student-empty-card">
          <span className="student-empty-icon" aria-hidden="true">◷</span>
          <h2>{t('Chưa có lịch thi trong khoảng thời gian này')}</h2>
          <p>{t('Thử điều chỉnh bộ lọc ngày hoặc quay lại sau khi có lịch thi được phân công.')}</p>
        </section>
      )}
      {!loading && !error && items.length > 0 && (
        <section className="exam-assignment-list" aria-label={t('Danh sách lịch thi')}>
          {items.map((item) => {
            const access = eligibility[item.assignmentId];
            const cancelled = item.sessionStatus === 'CANCELLED';
            return (
              <article key={item.assignmentId} className={`exam-assignment-card ${cancelled ? 'cancelled' : ''}`}>
                <div className="exam-assignment-heading">
                  <div>
                    <h2>{t(item.sessionName || 'Buổi thi vấn đáp')}</h2>
                    <p>{formatDateTime(item.scheduledTime, language)}</p>
                  </div>
                  <span className={`exam-assignment-status ${cancelled ? 'cancelled' : item.assignmentStatus.toLowerCase()}`}>
                    {t(cancelled ? 'Đã hủy' : statusLabels[item.assignmentStatus] ?? item.assignmentStatus)}
                  </span>
                </div>
                <dl className="exam-assignment-details">
                  <div><dt>{t('Thời lượng')}</dt><dd>{language === 'en' ? `${item.timeLimitMinutes} min` : `${item.timeLimitMinutes} phút`}</dd></div>
                  <div><dt>{t('Số câu hỏi')}</dt><dd>{language === 'en' ? `${item.maxMainQuestions} main · up to ${item.maxFollowupPerQuestion} follow-up questions each` : `${item.maxMainQuestions} câu chính · tối đa ${item.maxFollowupPerQuestion} câu hỏi phụ mỗi câu`}</dd></div>
                </dl>
                {!cancelled && (
                  <div className="exam-assignment-entry">
                    <div aria-live="polite">
                      {access === undefined && <p>{t('Đang kiểm tra điều kiện vào phòng…')}</p>}
                      {access === null && <p className="exam-entry-reason">{t('Chưa thể xác nhận điều kiện vào phòng thi. Thử tải lại lịch thi.')}</p>}
                      {access && !access.canEnter && (
                        <p className="exam-entry-reason">
                          {t(access.reason || 'Hiện chưa thể vào phòng thi.')} {formatWindow(access, language)}
                        </p>
                      )}
                    </div>
                    {access?.canEnter ? (
                      <button type="button" className="student-primary-button" onClick={() => enterRoom(item)}>{t('Vào phòng thi')}</button>
                    ) : (
                      <button type="button" className="student-primary-button" disabled>{t('Vào phòng thi')}</button>
                    )}
                    <Link to={APP_ROUTES.student.deviceCheck}>{t('Kiểm tra thiết bị')}</Link>
                  </div>
                )}
                {cancelled && <p className="exam-entry-reason">{t('Phiên thi này đã bị hủy.')}</p>}
              </article>
            );
          })}
        </section>
      )}
      {totalPages > 1 && (
        <nav className="exam-schedule-pagination" aria-label={t('Phân trang lịch thi')}>
          <button type="button" disabled={page <= 0 || loading} onClick={() => setPage((value) => value - 1)}>{t('Trước')}</button>
          <span>{t('Trang')} {page + 1} / {totalPages}</span>
          <button type="button" disabled={page + 1 >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>{t('Tiếp')}</button>
        </nav>
      )}
    </div>
  );
}
