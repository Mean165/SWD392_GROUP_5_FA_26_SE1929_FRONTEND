import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import { useAuth } from '../../../hooks/useAuth';
import useExamSessions from '../../../hooks/useExamSessions';
import useExamTopics from '../../../hooks/useExamTopics';
import type { ExamSessionStatus } from '../../../types/exam';
import { formatExamDateTime, SESSION_STATUS } from '../../../utils/examSession';
import './ExamManagement.css';
import './ExamManagementExtras.css';

const PAGE_SIZE = 10;

export default function ExamListPage() {
  const { user } = useAuth();
  const isAdmin = ['ADMIN', 'AD'].includes(String(user?.role ?? '').toUpperCase());
  const root = isAdmin ? '/admin/exam-sessions' : '/lecturer/exam-sessions';
  const topics = useExamTopics();
  const [status, setStatus] = useState<ExamSessionStatus | ''>('');
  const [topicId, setTopicId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const query = useMemo(() => ({ status: status || undefined, topicId: topicId || undefined, from: from || undefined, to: to || undefined, keyword: keyword.trim() || undefined, page, size: PAGE_SIZE }), [status, topicId, from, to, keyword, page]);
  const sessions = useExamSessions(query);
  const rows = sessions.result?.content ?? [];
  const totalPages = sessions.result?.totalPages ?? 0;
  const stats = rows.reduce((total, session) => ({
    students: total.students + (session.statistics?.studentCount ?? 0),
    completed: total.completed + (session.statistics?.completedCount ?? 0),
    absent: total.absent + (session.statistics?.absentCount ?? 0),
  }), { students: 0, completed: 0, absent: 0 });
  const resetPage = () => setPage(0);

  return <main className="exam-management-page">
    <PageHeader title="Quản lý kỳ thi" description="Theo dõi phiên thi, sinh viên tham gia và tiến độ tổ chức." actions={<Link className="primary-button" to={`${root}/create`}>+ Tạo phiên</Link>} />
    <section className="exam-stat-strip" aria-label="Thống kê nhanh">
      <div><span>Thí sinh trong kết quả</span><strong>{stats.students}</strong></div>
      <div><span>Đã thi</span><strong>{stats.completed}</strong></div>
      <div><span>Vắng</span><strong>{stats.absent}</strong></div>
    </section>
    {import.meta.env.VITE_USE_MOCK_EXAMS === 'true' && <p className="exam-mock-label" role="status">Dữ liệu mẫu</p>}
    <section className="exam-list-panel" aria-labelledby="exam-list-title">
      <div className="exam-list-heading"><div><h2 id="exam-list-title">Danh sách phiên thi</h2><p>{sessions.result?.totalElements ?? 0} phiên</p></div></div>
      <form className="exam-list-filters" onSubmit={(event) => { event.preventDefault(); resetPage(); }}>
        <label>Trạng thái<select value={status} onChange={(event) => { setStatus(event.target.value as ExamSessionStatus | ''); resetPage(); }}><option value="">Tất cả</option>{Object.entries(SESSION_STATUS).filter(([value]) => value !== 'DRAFT').map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></label>
        <label>Môn/chủ đề<select value={topicId} disabled={topics.loading} onChange={(event) => { setTopicId(event.target.value); resetPage(); }}><option value="">Tất cả</option>{topics.topics.map((topic) => <option key={topic.topicId} value={topic.topicId}>{topic.subjectName ? `${topic.subjectName} · ` : ''}{topic.topicName}</option>)}</select></label>
        <label>Từ ngày<input type="date" value={from} max={to || undefined} onChange={(event) => { setFrom(event.target.value); resetPage(); }} /></label>
        <label>Đến ngày<input type="date" value={to} min={from || undefined} onChange={(event) => { setTo(event.target.value); resetPage(); }} /></label>
        <label className="keyword-filter">Từ khóa<input type="search" placeholder="Tên phiên hoặc chủ đề" value={keyword} onChange={(event) => { setKeyword(event.target.value); resetPage(); }} /></label>
        <button type="button" className="secondary-button" onClick={() => { setStatus(''); setTopicId(''); setFrom(''); setTo(''); setKeyword(''); resetPage(); }}>Xóa lọc</button>
      </form>
      {(topics.error) && <div className="exam-inline-error" role="alert">{topics.error}<button type="button" className="text-action" onClick={topics.retry}>Thử lại</button></div>}
      {sessions.error && <div className="exam-inline-error" role="alert">{sessions.error}<button type="button" className="text-action" onClick={sessions.retry}>Thử lại</button></div>}
      {sessions.loading && <p className="exam-state" role="status">Đang tải danh sách phiên thi...</p>}
      {!sessions.loading && !sessions.error && rows.length === 0 && <div className="exam-empty" role="status"><strong>Chưa có phiên thi phù hợp.</strong><p>Thử đổi bộ lọc hoặc tạo phiên thi mới.</p></div>}
      {!sessions.loading && rows.length > 0 && <div className="exam-table-scroll"><table className="exam-table"><thead><tr><th>Phiên thi</th><th>Môn/chủ đề</th><th>Bắt đầu</th><th>Trạng thái</th><th>Sinh viên</th><th>Đã thi</th><th>Vắng</th></tr></thead><tbody>
        {rows.map((session) => {
          const state = SESSION_STATUS[session.status] ?? { label: session.status, color: 'gray' };
          const cancelled = session.status === 'CANCELLED';
          return <tr key={session.sessionId} className={cancelled ? 'is-cancelled' : ''}>
            <td><Link className="exam-session-link" to={`${root}/${encodeURIComponent(session.sessionId)}`}><strong>{session.sessionName}</strong><small>{session.createdByName ?? ''}</small></Link></td>
            <td>{session.topicName}</td><td>{formatExamDateTime(session.startTime)}</td>
            <td><span className={`exam-badge ${state.color}`}>{state.label}</span></td>
            <td>{session.statistics?.studentCount ?? '—'}</td><td>{session.statistics?.completedCount ?? '—'}</td><td>{session.statistics?.absentCount ?? '—'}</td>
          </tr>;
        })}
      </tbody></table></div>}
      {totalPages > 1 && <nav className="exam-pagination" aria-label="Phân trang kỳ thi"><button type="button" disabled={page === 0 || sessions.loading} onClick={() => setPage((value) => value - 1)}>Trước</button><span>Trang {page + 1} / {totalPages}</span><button type="button" disabled={page + 1 >= totalPages || sessions.loading} onClick={() => setPage((value) => value + 1)}>Sau</button></nav>}
    </section>
  </main>;
}
