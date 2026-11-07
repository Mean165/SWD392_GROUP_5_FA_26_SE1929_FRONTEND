import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import { allocateStudentAttempt, getExamSessionError, getExamSessionStudents, updateStudentSchedule } from '../../../api/examSessionApi';
import useActiveStudents from '../../../hooks/useActiveStudents';
import useExamSessionDetail from '../../../hooks/useExamSessionDetail';
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import type { StudentSessionAssignmentResponse } from '../../../types/exam';
import { BLOOM_ORDER, BLOOM_PRESENTATION, dateTimeLocalToOffset, dateTimeToVietnamLocalInput, formatExamDateTime, getExamErrorDetails, normalizeBloomDistribution, SESSION_STATUS, STUDENT_SESSION_STATUS } from '../../../utils/examSession';
import './ExamManagement.css';
import './ExamManagementExtras.css';

type Tab = 'overview' | 'readiness' | 'students';
const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'readiness', label: 'Sẵn sàng thi' },
  { id: 'students', label: 'Sinh viên & lịch' },
];

export default function ExamDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const isAdmin = ['ADMIN', 'AD'].includes(String(user?.role ?? '').toUpperCase());
  const root = isAdmin ? '/admin/exam-sessions' : '/lecturer/exam-sessions';
  const canWrite = ['ADMIN', 'AD', 'LECTURER', 'LE'].includes(String(user?.role ?? '').toUpperCase());
  const detail = useExamSessionDetail(id);
  const [tab, setTab] = useState<Tab>('overview');
  const [actionError, setActionError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [studentStatus, setStudentStatus] = useState('');
  const [studentPage, setStudentPage] = useState(0);
  const [studentKeyword, setStudentKeyword] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentCodes, setStudentCodes] = useState('');
  const [bulkResult, setBulkResult] = useState<{ added: StudentSessionAssignmentResponse[]; skipped: Array<{ identifier: string; row?: number; reason: string }> } | null>(null);
  const [scheduleStart, setScheduleStart] = useState('');
  const [scheduleEnd, setScheduleEnd] = useState('');
  const [scheduleEndEdited, setScheduleEndEdited] = useState(false);
  const [editTime, setEditTime] = useState<Record<string, string>>({});
  const activeStudents = useActiveStudents(studentKeyword);
  const assignments = detail.students?.content ?? [];
  const session = detail.session;
  const state = session ? SESSION_STATUS[session.status] ?? { label: session.status, color: 'gray' } : null;
  const distribution = normalizeBloomDistribution(session?.bloomDistribution);
  const bloomRows = useMemo(() => BLOOM_ORDER.map((level) => ({
    level,
    approved: detail.readiness?.approvedQuestionsByBloom?.[level] ?? 0,
    missing: detail.readiness?.missingQuestionsByBloom?.[level] ?? 0,
    required: distribution[level] ?? 0,
  })), [detail.readiness, distribution]);

  useEffect(() => {
    if (!scheduleStart && session?.startTime) setScheduleStart(dateTimeToVietnamLocalInput(session.startTime));
  }, [scheduleStart, session?.startTime]);

  useEffect(() => {
    if (!scheduleEndEdited && scheduleStart && session) {
      const start = dateTimeLocalToOffset(scheduleStart);
      if (!start) return;
      const duration = Math.max(1, assignments.length) * (session.timeLimitMinutes + (session.bufferMinutes ?? 0));
      setScheduleEnd(dateTimeToVietnamLocalInput(new Date(new Date(start).getTime() + duration * 60_000).toISOString()));
    }
  }, [assignments.length, scheduleEndEdited, scheduleStart, session]);

  useEffect(() => {
    if (tab === 'overview') void detail.loadStudents({ page: 0, size: 100 });
    if (tab === 'readiness') void detail.loadReadiness();
    if (tab === 'students') void detail.loadStudents({ status: studentStatus as never, page: studentPage, size: 50 });
  }, [tab, studentStatus, studentPage]);

  const runAction = async (action: () => Promise<unknown>, after?: () => Promise<unknown>): Promise<boolean> => {
    setActionBusy(true); setActionError('');
    try { await action(); await after?.(); return true; }
    catch (error) { setActionError(getExamSessionError(error)); return false; }
    finally { setActionBusy(false); }
  };

  const toggleStudent = (studentId: string) => setSelectedStudentIds((current) => current.includes(studentId) ? current.filter((idValue) => idValue !== studentId) : [...current, studentId]);
  const submitBulk = () => {
    const codes = studentCodes.split(/[\s,;]+/).map((value) => value.trim()).filter(Boolean);
    if (!selectedStudentIds.length && !codes.length) { setActionError('Tìm và chọn sinh viên bằng email hoặc mã, hoặc nhập mã sinh viên trước khi thêm.'); return; }
    void runAction(async () => {
      const result = await detail.addStudents({ studentIds: selectedStudentIds, studentCodes: codes });
      setBulkResult(result); setSelectedStudentIds([]); setStudentCodes('');
    });
  };

  const scheduleAllStudents = () => {
    const start = dateTimeLocalToOffset(scheduleStart);
    const end = dateTimeLocalToOffset(scheduleEnd);
    if (!start || !end || !session) { setActionError('Nhập giờ bắt đầu và kết thúc hợp lệ.'); return; }
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    const slotMs = (session.timeLimitMinutes + (session.bufferMinutes ?? 0)) * 60_000;
    void runAction(async () => {
      const firstPage = await getExamSessionStudents(id, { page: 0, size: 100 });
      const roster = [...firstPage.content];
      for (let page = 1; page < firstPage.totalPages; page += 1) {
        roster.push(...(await getExamSessionStudents(id, { page, size: 100 })).content);
      }
      const schedulable = roster.filter((student) => !['CANCELLED', 'COMPLETED', 'ABSENT'].includes(student.status));
      if (schedulable.length === 0) throw new Error('Thêm sinh viên vào phiên trước khi xếp lịch.');
      const requiredMs = Math.max(0, schedulable.length - 1) * slotMs + session.timeLimitMinutes * 60_000;
      if (endMs <= startMs || endMs - startMs < requiredMs) throw new Error('Khung giờ kết thúc phải đủ để xếp lần lượt tất cả sinh viên.');
      for (const [index, student] of schedulable.entries()) {
        const scheduledTime = new Date(startMs + index * slotMs).toISOString();
        await scheduleStudent(student, scheduledTime);
      }
    }, () => detail.loadStudents({ status: studentStatus as never, page: studentPage, size: 50 }));
  };

  const saveStudentTime = (studentId: string) => {
    const scheduledTime = dateTimeLocalToOffset(editTime[studentId] ?? '');
    if (!scheduledTime) { setActionError('Nhập giờ thi hợp lệ.'); return; }
    const student = assignments.find((item) => item.studentId === studentId);
    if (!student) return;
    void runAction(() => scheduleStudent(student, scheduledTime), () => detail.loadStudents({ status: studentStatus as never, page: studentPage, size: 50 }));
  };

  const scheduleStudent = (student: StudentSessionAssignmentResponse, scheduledTime: string) => {
    const hasAllocatedAttempt = Boolean(student.attemptId)
      || (student.attemptsUsed ?? 0) > 0
      || Boolean(student.attempts?.some((attempt) => attempt.attemptNo === 1 && !attempt.voided));
    return hasAllocatedAttempt
      ? updateStudentSchedule(id, student.studentId, scheduledTime, 1)
      : allocateStudentAttempt(id, student.studentId, scheduledTime);
  };

  const removeSession = () => {
    if (!window.confirm('Xóa phiên thi này? Thao tác không thể hoàn tác.')) return;
    void runAction(async () => {
      try { await detail.remove(); }
      catch (error) {
        const details = getExamErrorDetails(error);
        if (details.status === 409) throw new Error(`${details.message} Hãy dùng thao tác Hủy phiên nếu cần dừng kỳ thi.`);
        throw error;
      }
    }).then((success) => { if (success) navigate(root); });
  };

  const startSession = () => {
    if (!window.confirm('Bắt đầu phiên thi ngay bây giờ?')) return;
    void runAction(detail.start, detail.loadSession);
  };

  const submitCancel = () => {
    if (!cancelReason.trim()) { setActionError('Nhập lý do hủy phiên thi.'); return; }
    const confirmed = window.confirm('Xác nhận hủy phiên thi?');
    if (!confirmed) return;
    void runAction(() => detail.cancel(cancelReason.trim()), detail.loadSession).then((success) => { if (success) setCancelOpen(false); });
  };

  if (detail.loading) return <main className="exam-detail-page"><p className="exam-state" role="status">Đang tải chi tiết phiên thi...</p></main>;
  if (detail.error || !session) return <main className="exam-detail-page"><PageHeader title="Chi tiết phiên thi" /><div className="exam-inline-error" role="alert">{detail.error || 'Không tìm thấy phiên thi.'}<button type="button" className="text-action" onClick={() => void detail.loadSession()}>Thử lại</button></div><Link to={root}>Quay lại danh sách</Link></main>;

  return <main className="exam-detail-page">
    <PageHeader title={session.sessionName} description={`${session.topicName} · ${formatExamDateTime(session.startTime)}`} actions={<div className="exam-detail-actions">
      <Link className="exam-outline-action" to={root}>Danh sách phiên</Link>
      {session.status === 'SCHEDULED' && <Link className="exam-outline-action" to={`${root}/${encodeURIComponent(id)}/edit`}>Sửa phiên</Link>}
      {session.status === 'SCHEDULED' && <button type="button" className="exam-primary-action" disabled={!canWrite || actionBusy || !detail.readiness || !(detail.readiness.ready ?? detail.readiness.canStart)} onClick={startSession}>Bắt đầu</button>}
      {['SCHEDULED', 'IN_PROGRESS'].includes(session.status) && <button type="button" className="exam-danger-action" disabled={!canWrite || actionBusy} onClick={() => { setCancelReason(''); setCancelOpen(true); }}>Hủy phiên</button>}
      {session.status !== 'CANCELLED' && <button type="button" className="exam-danger-action" disabled={!canWrite || actionBusy} onClick={removeSession}>Xóa</button>}
    </div>} />
    <div className="exam-detail-heading"><span className={`exam-badge ${state?.color ?? 'gray'}`}>{state?.label ?? session.status}</span><span>Mã phiên: {session.sessionId}</span></div>
    {import.meta.env.VITE_USE_MOCK_EXAMS === 'true' && <p className="exam-mock-label" role="status">Dữ liệu mẫu</p>}
    {actionError && <div className="exam-inline-error" role="alert">{actionError}<button type="button" className="text-action" onClick={() => setActionError('')}>Đóng</button></div>}
    <nav className="exam-tabs" role="tablist" aria-label="Các phần chi tiết kỳ thi">{TABS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={`exam-tab${tab === item.id ? ' active' : ''}`} onClick={() => setTab(item.id)}>{item.label}</button>)}</nav>

    {tab === 'overview' && <section className="exam-detail-panel" role="tabpanel"><h2>Tổng quan</h2>
      <dl className="exam-overview-grid">
        <div><dt>Môn/chủ đề</dt><dd>{session.topicName}</dd></div><div><dt>Người tạo</dt><dd>{session.createdByName || '—'}</dd></div><div><dt>Thời lượng mỗi sinh viên</dt><dd>{session.timeLimitMinutes} phút</dd></div>
        <div><dt>Số câu chính</dt><dd>{session.maxMainQuestions}</dd></div><div><dt>Câu xoáy tối đa</dt><dd>{session.maxFollowupPerQuestion}</dd></div><div><dt>Buffer</dt><dd>{session.bufferMinutes ?? 0} phút</dd></div>
        <div><dt>Cửa sổ tránh trùng</dt><dd>{session.avoidRepeatWindow ?? '—'}</dd></div><div><dt>Sinh viên</dt><dd>{session.statistics?.studentCount ?? assignments.length}</dd></div><div><dt>Đã thi / Vắng</dt><dd>{session.statistics?.completedCount ?? 0} / {session.statistics?.absentCount ?? 0}</dd></div>
      </dl>
      <h3>Phân bố Bloom</h3>
      {Object.keys(distribution).length > 0 ? <div className="exam-bloom-list">{BLOOM_ORDER.filter((level) => (distribution[level] ?? 0) > 0).map((level) => <span key={level} className={`exam-bloom-badge ${BLOOM_PRESENTATION[level].color}`}>{BLOOM_PRESENTATION[level].label}: {distribution[level]}</span>)}</div> : <p className="field-hint">Hệ thống tự rải đều từ mức thấp lên cao.</p>}
      {session.description && <p>{session.description}</p>}
    </section>}

    {tab === 'readiness' && <section className="exam-detail-panel" role="tabpanel"><div className="exam-list-heading"><div><h2>Sẵn sàng thi</h2><p>Đối chiếu sinh viên, lịch và ngân hàng câu hỏi.</p></div><button type="button" className="exam-outline-action" disabled={detail.readinessLoading} onClick={() => void detail.loadReadiness()}>Làm mới</button></div>
      {detail.readinessLoading && <p className="exam-state" role="status">Đang kiểm tra...</p>}
      {detail.readinessError && <div className="exam-inline-error" role="alert">{detail.readinessError}<button type="button" className="text-action" onClick={() => void detail.loadReadiness()}>Thử lại</button></div>}
      {detail.readiness && <><p><span className={`exam-badge ${(detail.readiness.ready ?? detail.readiness.canStart) ? 'green' : 'red'}`}>{(detail.readiness.ready ?? detail.readiness.canStart) ? 'Có thể bắt đầu' : 'Chưa thể bắt đầu'}</span> {detail.readiness.studentCount} sinh viên · {detail.readiness.unscheduledCount} chưa xếp · {detail.readiness.overlappingCount} cặp lịch giờ trùng</p>
        <p>{t('Với {count} câu chính và giới hạn {percent}%, tối đa {maximum} câu có thể trùng giữa hai sinh viên.', { count: session.maxMainQuestions, percent: session.maxOverlapPercent ?? 40, maximum: Math.floor(session.maxMainQuestions * (session.maxOverlapPercent ?? 40) / 100) })}</p>
        <div className="exam-readiness-grid"><div><h3>Ngân hàng câu hỏi</h3>{bloomRows.map(({ level, approved, missing, required }) => {
          const issue = detail.readiness?.issues?.find((item) => item.code === 'INSUFFICIENT_QUESTIONS' && item.bloomLevel === level);
          const have = issue?.have ?? approved;
          const need = issue?.need ?? (required || approved + missing);
          const denominator = need || have || 1;
          return <div className="readiness-row" key={level}><span>{BLOOM_PRESENTATION[level].label}</span><div className="readiness-track" aria-label={`${BLOOM_PRESENTATION[level].label}: ${have} câu đã duyệt, cần ${need}`}><div className="readiness-fill" style={{ width: `${Math.min(100, have / denominator * 100)}%` }} /><div className="readiness-fill missing" style={{ width: `${Math.min(100, Math.max(0, need - have) / denominator * 100)}%` }} /></div><strong>{have}{need ? ` / ${need}` : ''}</strong></div>;
        })}</div>
          <div><h3>{t('Rubric môn')}</h3>{(detail.readiness.issues ?? []).filter((item) => ['SUBJECT_RUBRIC_MISSING', 'SUBJECT_RUBRIC_INVALID'].includes(item.code)).length ? <ul className="exam-check-list errors">{detail.readiness.issues.filter((item) => ['SUBJECT_RUBRIC_MISSING', 'SUBJECT_RUBRIC_INVALID'].includes(item.code)).map((item, index) => <li key={`${item.code}-${index}`}>{t(item.code === 'SUBJECT_RUBRIC_MISSING' ? 'Môn học chưa có rubric active.' : 'Rubric môn học có tiêu chí hoặc trọng số không hợp lệ.')}</li>)}</ul> : <p>{t('Đạt')}</p>}
            <h3>{t('Câu hỏi đã duyệt theo Bloom')}</h3>{(detail.readiness.issues ?? []).filter((item) => item.code === 'INSUFFICIENT_QUESTIONS').map((item, index) => <p role="alert" key={`${item.code}-${item.bloomLevel}-${index}`}>{t('Mức {bloomLevel} hiện có {have} câu đã duyệt, cần ít nhất {need} câu.', { bloomLevel: item.bloomLevel ?? '', have: item.have ?? 0, need: item.need ?? 0 })}</p>)}
            <h3>{t('Khả năng cấp phát đề')}</h3>{(detail.readiness.issues ?? []).filter((item) => item.code === 'OVERLAP_EXCEEDS_LIMIT').map((item, index) => <div role="alert" key={`${item.code}-${index}`}><p>{t('Không thể cấp phát đề với giới hạn trùng {maxPercent}%.', { maxPercent: item.maxPercent ?? session.maxOverlapPercent ?? 40 })}</p>{item.minimumAdditionalQuestions != null && <p>{item.minimumIsUpperBound ? t('Có thể cần bổ sung tối đa {count} câu để tạo pool khả thi.', { count: item.minimumAdditionalQuestions }) : t('Cần thêm ít nhất {count} câu để tạo pool khả thi.', { count: item.minimumAdditionalQuestions })}{item.minimumIsUpperBound ? ` ${t('Số câu bổ sung là cận trên ước lượng đủ để tạo pool khả thi, không phải số tối thiểu đã được chứng minh.')}` : ''}</p>}{item.additionalQuestionsByBloom && <p>{BLOOM_ORDER.map((level) => item.additionalQuestionsByBloom?.[level] ? `${BLOOM_PRESENTATION[level].label}: ${item.additionalQuestionsByBloom[level]}` : '').filter(Boolean).join(' · ')}</p>}</div>)}{(detail.readiness.issues ?? []).length > 0 && !(detail.readiness.issues ?? []).some((item) => item.code === 'OVERLAP_EXCEEDS_LIMIT') && <p>{t('Đạt')}</p>}
            <h3>{t('Trùng lịch giờ thi')} ({detail.readiness.overlappingCount})</h3>{(detail.readiness.issues ?? []).filter((item) => item.code === 'SCHEDULE_OVERLAP').map((item, index) => <p role="alert" key={`${item.code}-${index}`}>{t('Có {have} cặp lịch thi bị trùng giờ.', { have: item.have ?? detail.readiness?.overlappingCount ?? 0 })}</p>)}{!(detail.readiness.issues ?? []).some((item) => item.code === 'SCHEDULE_OVERLAP') && <p>{t('Đạt')}</p>}
            <h3>Cảnh báo</h3>{detail.readiness.unscheduledCount > 0 && <p>{t('Có {count} sinh viên chưa có giờ thi.', { count: detail.readiness.unscheduledCount })}</p>}{detail.readiness.warnings.length ? <ul className="exam-check-list">{detail.readiness.warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul> : detail.readiness.unscheduledCount === 0 && <p>Không có cảnh báo.</p>}
            {(!detail.readiness.issues || detail.readiness.issues.length === 0) && detail.readiness.blockingErrors?.length > 0 && <><h3>Lỗi chặn</h3><ul className="exam-check-list errors">{detail.readiness.blockingErrors.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></>}
          </div>
        </div>
      </>}
    </section>}

    {tab === 'students' && <section className="exam-detail-panel" role="tabpanel"><div className="exam-list-heading"><div><h2>Sinh viên & lịch</h2><p>{detail.students?.totalElements ?? 0} sinh viên được gán vào phiên.</p></div><button type="button" className="exam-outline-action" disabled={detail.studentsLoading} onClick={() => void detail.loadStudents({ status: studentStatus as never, page: studentPage, size: 50 })}>Làm mới</button></div>
      <section className="exam-attempt-settings" aria-labelledby="exam-schedule-window-title"><h3 id="exam-schedule-window-title">Khung giờ thi</h3><div className="exam-add-controls"><label>Giờ bắt đầu<input type="datetime-local" value={scheduleStart} onChange={(event) => setScheduleStart(event.target.value)} /></label><label>Giờ kết thúc<input type="datetime-local" value={scheduleEnd} onChange={(event) => { setScheduleEndEdited(true); setScheduleEnd(event.target.value); }} /></label><button type="button" className="exam-primary-action" disabled={!canWrite || actionBusy} onClick={scheduleAllStudents}>Xếp lịch sinh viên</button></div><p className="field-hint">Mỗi sinh viên được xếp một giờ thi theo thời lượng phiên và thời gian nghỉ giữa các sinh viên.</p></section>
      <div className="exam-add-controls">
        <label>Tìm sinh viên<select aria-label="Chọn sinh viên" value="" onChange={(event) => { if (event.target.value) toggleStudent(event.target.value); }}><option value="">Chọn để thêm...</option>{activeStudents.students.filter((student) => !assignments.some((assignment) => assignment.studentId === student.userId)).map((student) => <option key={student.userId} value={student.userId}>{student.fullName} · {student.studentOrStaffCode}</option>)}</select></label>
        <label>Tìm bằng email hoặc mã SV<input type="search" value={studentKeyword} onChange={(event) => setStudentKeyword(event.target.value)} placeholder="Email hoặc mã sinh viên" /></label>
        <label>Mã số sinh viên<textarea rows={2} value={studentCodes} onChange={(event) => setStudentCodes(event.target.value)} placeholder="Nhập nhiều mã, cách nhau bằng dấu phẩy hoặc xuống dòng" /></label>
        <button type="button" className="exam-primary-action" disabled={!canWrite || actionBusy} onClick={submitBulk}>Thêm sinh viên</button>
      </div>
      {activeStudents.loading && <p className="field-hint" role="status">Đang tìm sinh viên...</p>}
      {activeStudents.error && <div className="exam-inline-error" role="alert">{activeStudents.error}<button type="button" className="text-action" onClick={activeStudents.retry}>Thử lại</button></div>}
      {selectedStudentIds.length > 0 && <p className="field-hint">Đã chọn {selectedStudentIds.length} sinh viên: {selectedStudentIds.map((studentId) => activeStudents.students.find((student) => student.userId === studentId)?.fullName ?? studentId).join(', ')}</p>}
      {bulkResult && <section className="exam-import-result" aria-live="polite"><strong>Đã thêm {bulkResult.added.length} sinh viên · Bỏ qua {bulkResult.skipped.length}</strong>{bulkResult.skipped.length > 0 && <div className="exam-table-scroll"><table className="exam-student-table"><thead><tr><th>Mã/định danh</th><th>Dòng</th><th>Lý do</th></tr></thead><tbody>{bulkResult.skipped.map((item, index) => <tr key={`${item.identifier}-${index}`}><td>{item.identifier}</td><td>{item.row ?? '—'}</td><td>{item.reason}</td></tr>)}</tbody></table></div>}</section>}
      {detail.studentsError && <div className="exam-inline-error" role="alert">{detail.studentsError}<button type="button" className="text-action" onClick={() => void detail.loadStudents({ page: studentPage, size: 50 })}>Thử lại</button></div>}
      {detail.studentsLoading && <p className="exam-state" role="status">Đang tải sinh viên...</p>}
      <div className="exam-list-filters exam-student-filter"><label>Trạng thái<select value={studentStatus} onChange={(event) => { setStudentStatus(event.target.value); setStudentPage(0); }}><option value="">Tất cả trạng thái</option>{Object.entries(STUDENT_SESSION_STATUS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></label></div>
      {!detail.studentsLoading && assignments.length === 0 && <div className="exam-empty" role="status">Chưa có sinh viên trong phiên.</div>}
      {assignments.length > 0 && <div className="exam-table-scroll"><table className="exam-student-table"><thead><tr><th>Slot</th><th>Sinh viên</th><th>Trạng thái</th><th>Giờ thi</th><th>Điểm AI</th><th>Điểm chốt</th><th>Thao tác</th></tr></thead><tbody>{assignments.map((student) => { const presentation = STUDENT_SESSION_STATUS[student.status] ?? { label: student.status, color: 'gray' }; const time = editTime[student.studentId] ?? (student.scheduledTime ? new Date(new Date(student.scheduledTime).getTime() - new Date(student.scheduledTime).getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : ''); return <tr key={student.assignmentId}><td>{student.slotOrder ?? '—'}</td><td><strong>{student.studentName}</strong><small>{student.studentCode} · {student.studentEmail}</small></td><td><span className={`exam-badge ${presentation.color}`}>{presentation.label}</span></td><td><input aria-label={`Giờ thi của ${student.studentName}`} type="datetime-local" value={time} onChange={(event) => setEditTime((current) => ({ ...current, [student.studentId]: event.target.value }))} /></td><td>{student.aiScore ?? '—'}</td><td>{student.finalScore ?? student.totalScore ?? '—'}</td><td><button type="button" className="text-action" disabled={!canWrite || actionBusy || !time} onClick={() => saveStudentTime(student.studentId)}>Lưu giờ</button></td></tr>; })}</tbody></table></div>}
      {(detail.students?.totalPages ?? 0) > 1 && <nav className="exam-pagination" aria-label="Phân trang sinh viên"><button type="button" disabled={studentPage <= 0} onClick={() => setStudentPage((value) => value - 1)}>Trước</button><span>Trang {studentPage + 1} / {detail.students?.totalPages}</span><button type="button" disabled={studentPage + 1 >= (detail.students?.totalPages ?? 0)} onClick={() => setStudentPage((value) => value + 1)}>Sau</button></nav>}
    </section>}

    {cancelOpen && <div className="exam-modal-backdrop" role="presentation"><section className="exam-modal" role="alertdialog" aria-modal="true" aria-labelledby="cancel-session-title"><h2 id="cancel-session-title">Hủy phiên thi</h2><label>Lý do hủy<textarea rows={3} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} /></label><div className="exam-modal-actions"><button type="button" className="exam-outline-action" onClick={() => setCancelOpen(false)}>Quay lại</button><button type="button" className="exam-danger-action" disabled={!canWrite || actionBusy || !cancelReason.trim()} onClick={submitCancel}>Xác nhận hủy</button></div></section></div>}
  </main>;
}
