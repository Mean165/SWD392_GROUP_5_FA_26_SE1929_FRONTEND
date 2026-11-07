import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import { getGradingErrorMessage, getGradingQueue, type GradingQueueFilters } from '../../../api/gradingApi';
import type { GradingQueueEntry, GradingQueuePage } from '../../../types/evaluation';
import { useLanguage } from '../../../context/LanguageContext';
import './EvaluationPages.css';

const PAGE_SIZE = 20;
const QUEUE_STATUSES = ['WAITING_SESSION', 'AI_PENDING', 'AI_SCORING', 'AI_SCORED', 'AI_FAILED', 'IN_REVIEW', 'FINALIZED', 'RELEASED', 'REOPENED', 'VOIDED'];
const STATUS_LABELS: Record<string, string> = {
  WAITING_SESSION: 'Chờ hoàn tất bài thi', AI_PENDING: 'Chờ AI chấm', AI_SCORING: 'AI đang chấm',
  AI_SCORED: 'AI đã chấm', AI_FAILED: 'AI chấm lỗi', IN_REVIEW: 'Chờ giảng viên',
  FINALIZED: 'Đã chốt điểm', RELEASED: 'Đã công bố', REOPENED: 'Đã mở lại', VOIDED: 'Đã hủy',
};

const formatDate = (value: string | null, language: 'vi' | 'en') => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'vi-VN', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date);
};

const statusColor = (status: string) => {
  if (['FINALIZED', 'RELEASED'].includes(status)) return 'green';
  if (['AI_FAILED', 'VOIDED'].includes(status)) return 'red';
  if (['AI_SCORING', 'AI_PENDING'].includes(status)) return 'amber';
  return 'blue';
};

export default function EvaluationListPage() {
  const { t, language } = useLanguage();
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<GradingQueuePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const filters = useMemo<GradingQueueFilters>(() => ({
    page,
    size: PAGE_SIZE,
    status: status || undefined,
    finishedFrom: from ? `${from}T00:00:00+07:00` : undefined,
    finishedTo: to ? `${to}T23:59:59+07:00` : undefined,
  }), [from, page, status, to]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    getGradingQueue(filters, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setResult(data); })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(getGradingErrorMessage(requestError));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filters, reloadKey]);

  const rows = result?.items ?? [];
  const totalPages = result?.total ? Math.ceil(result.total / PAGE_SIZE) : 0;
  const setFilter = (setter: (value: string) => void) => (value: string) => { setter(value); setPage(0); };

  return <main className="grading-page">
    <PageHeader title="Hàng đợi chấm điểm" description="Bài thi đã hoàn tất của học sinh cần giảng viên rà soát." />
    <section className="grading-queue" aria-labelledby="grading-queue-title">
      <div className="grading-queue-heading">
        <div><h2 id="grading-queue-title">Bài thi của học sinh</h2><p>{result?.total ?? 0} bài</p></div>
        <button type="button" className="grading-secondary-button" disabled={loading} onClick={() => setReloadKey((value) => value + 1)}>Làm mới</button>
      </div>
      <form className="grading-filters" onSubmit={(event) => event.preventDefault()}>
        <label>Trạng thái<select value={status} onChange={(event) => setFilter(setStatus)(event.target.value)}><option value="">Tất cả trạng thái</option>{QUEUE_STATUSES.map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}</select></label>
        <label>Từ ngày<input type="date" value={from} onChange={(event) => setFilter(setFrom)(event.target.value)} /></label>
        <label>Đến ngày<input type="date" value={to} onChange={(event) => setFilter(setTo)(event.target.value)} /></label>
        <button type="button" className="grading-secondary-button" onClick={() => { setStatus(''); setFrom(''); setTo(''); setPage(0); }}>Xóa lọc</button>
      </form>
      {error && <div className="grading-error" role="alert">{t(error)} <button type="button" onClick={() => setReloadKey((value) => value + 1)}>Thử lại</button></div>}
      {loading && <p className="grading-state" role="status">Đang tải bài thi...</p>}
      {!loading && !error && rows.length === 0 && <div className="grading-empty" role="status">Chưa có bài thi nào trong hàng đợi chấm điểm.</div>}
      {!loading && !error && rows.length > 0 && <div className="grading-table-wrap"><table className="grading-table">
        <thead><tr><th>Học sinh</th><th>Kỳ thi</th><th>Lượt</th><th>Hoàn tất lúc</th><th>Trạng thái</th><th>AI</th><th>Tổng điểm</th><th /></tr></thead>
        <tbody>{rows.map((item: GradingQueueEntry) => <tr key={item.submissionId}>
          <td><strong>{item.studentName}</strong><small>{item.studentId}</small></td>
          <td>{item.examName}</td>
          <td>{item.attemptNo}</td>
          <td>{formatDate(item.sessionFinishedAt, language)}</td>
          <td><span className={`grading-status ${statusColor(item.status)}`}>{STATUS_LABELS[item.status] ?? item.status}</span></td>
          <td>{item.aiStatus}</td>
          <td>{item.lecturerTotalScore == null ? '—' : `${new Intl.NumberFormat(language === 'en' ? 'en-US' : 'vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.lecturerTotalScore)} / 10`}</td>
          <td><Link className="grading-open-link" to={`/lecturer/evaluations/${encodeURIComponent(item.submissionId)}`}>Mở bài thi</Link></td>
        </tr>)}</tbody>
      </table></div>}
      {totalPages > 1 && <nav className="grading-pagination" aria-label="Phân trang bài thi">
        <button type="button" disabled={page === 0 || loading} onClick={() => setPage((value) => value - 1)}>Trước</button>
        <span>Trang {page + 1} / {totalPages}</span>
        <button type="button" disabled={page + 1 >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Sau</button>
      </nav>}
    </section>
  </main>;
}
