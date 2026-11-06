import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import { getExamSessionError, getExamSessionStudents } from '../../../api/examSessionApi';
import { allocateStudentAttempt, cancelExamAttempt, getExamAttemptAudit, getExamAttemptSettings, grantStudentAttempts, revokeStudentAttempts, selectOfficialAttempt, updateExamAttemptSettings, voidExamAttempt } from '../../../api/examSessionApi';
import useActiveStudents from '../../../hooks/useActiveStudents';
import useExamSessionDetail from '../../../hooks/useExamSessionDetail';
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import type { AutoScheduleResponse, ExamAttemptSettings, ExamScorePolicy, StudentQuestionPlan, StudentSessionAssignmentResponse } from '../../../types/exam';
import type { ExamAttemptAuditRecord } from '../../../types/exam';
import { BLOOM_ORDER, BLOOM_PRESENTATION, dateTimeLocalToOffset, dateTimeToVietnamLocalInput, formatExamDateTime, getExamErrorDetails, normalizeBloomDistribution, SESSION_STATUS, STUDENT_SESSION_STATUS } from '../../../utils/examSession';
import './ExamManagement.css';
import './ExamManagementExtras.css';

type Tab = 'overview' | 'readiness' | 'students' | 'plan';
const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'readiness', label: 'Sẵn sàng thi' },
  { id: 'students', label: 'Sinh viên & lịch' },
  { id: 'plan', label: 'Bộ đề & trùng lặp' },
];

const localInputValue = () => dateTimeToVietnamLocalInput(new Date().toISOString());

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
  const [bulkExtraAttempts, setBulkExtraAttempts] = useState('0');
  const [bulkResult, setBulkResult] = useState<{ added: StudentSessionAssignmentResponse[]; skipped: Array<{ identifier: string; row?: number; reason: string }> } | null>(null);
  const [scheduleStart, setScheduleStart] = useState(localInputValue());
  const [shuffle, setShuffle] = useState(true);
  const [seed, setSeed] = useState('');
  const [slotMinutes, setSlotMinutes] = useState('20');
  const [scheduleAttemptNo, setScheduleAttemptNo] = useState('1');
  const [schedulePreview, setSchedulePreview] = useState<AutoScheduleResponse | null>(null);
  const [planStudentId, setPlanStudentId] = useState('');
  const [plan, setPlan] = useState<StudentQuestionPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState('');
  const [editTime, setEditTime] = useState<Record<string, string>>({});
  const [attemptSettings, setAttemptSettings] = useState<ExamAttemptSettings | null>(null);
  const [attemptSettingsError, setAttemptSettingsError] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [attemptAction, setAttemptAction] = useState<{ studentId: string; kind: 'grant' | 'revoke' | 'schedule' | 'reason'; attemptId?: string; action?: 'cancel' | 'void' } | null>(null);
  const [attemptActionReason, setAttemptActionReason] = useState('');
  const [attemptActionCount, setAttemptActionCount] = useState('1');
  const [attemptScheduleTime, setAttemptScheduleTime] = useState(localInputValue());
  const [settingsWarning, setSettingsWarning] = useState(false);
  const [attemptAudit, setAttemptAudit] = useState<ExamAttemptAuditRecord[] | null>(null);
  const [auditError, setAuditError] = useState('');
  const originalMaxAttemptsRef = useRef<number | null>(null);
  const activeStudents = useActiveStudents(studentKeyword);
  const assignments = detail.students?.content ?? [];
  const hasActiveAttempts = assignments.some((item) => item.attemptStatus === 'IN_PROGRESS');
  const hasAttempt = (item: StudentSessionAssignmentResponse) => Boolean(item.attemptId)
    || (Boolean(item.attemptStatus) && item.attemptStatus !== 'NOT_STARTED')
    || ['IN_PROGRESS', 'COMPLETED', 'ABSENT'].includes(item.status);
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
    if (tab === 'overview') void detail.loadStudents({ page: 0, size: 100 });
    if (tab === 'readiness') void detail.loadReadiness();
    if (tab === 'students') void detail.loadStudents({ status: studentStatus as never, page: studentPage, size: 50 });
    if (tab === 'plan') void detail.loadUsage();
  }, [tab, studentStatus, studentPage]);

  useEffect(() => {
    let active = true;
    getExamAttemptSettings(id).then((settings) => { if (active) { setAttemptSettings(settings); originalMaxAttemptsRef.current = settings.maxAttempts; } })
      .catch((error) => { if (active) setAttemptSettingsError(getExamSessionError(error)); });
    return () => { active = false; };
  }, [id]);

  const saveAttemptSettings = async () => {
    if (!attemptSettings) return;
    if (attemptSettings.maxAttempts < (originalMaxAttemptsRef.current ?? attemptSettings.maxAttempts) && !settingsWarning) {
      setActionBusy(true);
      try {
        const firstPage = await getExamSessionStudents(id, { page: 0, size: 200 });
        const roster = [...firstPage.content];
        for (let page = 1; page < firstPage.totalPages; page += 1) roster.push(...(await getExamSessionStudents(id, { page, size: 200 })).content);
        const affectedStudents = roster.filter((student) => (student.attemptsUsed ?? 0) > attemptSettings.maxAttempts).map((student) => ({ studentId: student.studentId, studentName: student.studentName, attemptsUsed: student.attemptsUsed ?? 0 }));
        setAttemptSettings({ ...attemptSettings, affectedStudents });
        if (affectedStudents.length) { setSettingsWarning(true); setActionBusy(false); return; }
      } catch (error) {
        setAttemptSettingsError(getExamSessionError(error));
        setActionBusy(false);
        return;
      }
      setActionBusy(false);
    }
    setActionBusy(true); setAttemptSettingsError('');
    try {
      const result = await updateExamAttemptSettings(id, attemptSettings);
      setAttemptSettings(result); originalMaxAttemptsRef.current = result.maxAttempts; setSettingsWarning(false);
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setAttemptSettingsError(t('Cấu hình đã được thay đổi ở nơi khác. Đã tải lại phiên bản mới; hãy kiểm tra và lưu lại.'));
        try { const latest = await getExamAttemptSettings(id); setAttemptSettings(latest); originalMaxAttemptsRef.current = latest.maxAttempts; } catch { /* retain conflict message */ }
      } else setAttemptSettingsError(getExamSessionError(error));
    } finally { setActionBusy(false); }
  };

  const loadAttemptAudit = async () => {
    setAuditError('');
    try { setAttemptAudit(await getExamAttemptAudit(id)); }
    catch (error) { setAuditError(getExamSessionError(error)); }
  };

  const submitAttemptAction = async () => {
    if (!attemptAction || (attemptAction.kind !== 'schedule' && !attemptActionReason.trim())) return;
    const student = assignments.find((item) => item.studentId === attemptAction.studentId);
    if (!student) return;
    const reason = attemptActionReason.trim();
    const count = Math.max(1, Number(attemptActionCount) || 1);
    const scheduledTime = dateTimeLocalToOffset(attemptScheduleTime);
    const ok = await runAction(async () => {
      if (attemptAction.kind === 'grant') await grantStudentAttempts(id, student.studentId, count, reason);
      else if (attemptAction.kind === 'revoke') await revokeStudentAttempts(id, student.studentId, count, reason);
      else if (attemptAction.kind === 'schedule' && scheduledTime) await allocateStudentAttempt(id, student.studentId, scheduledTime);
      else if (attemptAction.kind === 'reason' && attemptAction.attemptId && attemptAction.action === 'cancel') await cancelExamAttempt(attemptAction.attemptId, reason);
      else if (attemptAction.kind === 'reason' && attemptAction.attemptId && attemptAction.action === 'void') await voidExamAttempt(attemptAction.attemptId, reason);
    }, () => detail.loadStudents({ status: studentStatus as never, page: studentPage, size: 50 }));
    if (ok) { setAttemptAction(null); setAttemptActionReason(''); }
  };

  useEffect(() => {
    if (!planStudentId) { setPlan(null); return; }
    const selected = assignments.find((item) => item.studentId === planStudentId);
    if (!selected?.attemptId) { setPlan(null); return; }
    let active = true;
    setPlanLoading(true); setPlanError('');
    detail.loadPlan(selected.attemptId).then((value) => { if (active) setPlan(value); })
      .catch((error) => { if (active) setPlanError(getExamSessionError(error, 'Không thể tải bộ câu hỏi của sinh viên.')); })
      .finally(() => { if (active) setPlanLoading(false); });
    return () => { active = false; };
  }, [assignments, detail.loadPlan, planStudentId]);

  const runAction = async (action: () => Promise<unknown>, after?: () => Promise<unknown>): Promise<boolean> => {
    setActionBusy(true); setActionError('');
    try { await action(); await after?.(); return true; }
    catch (error) { setActionError(getExamSessionError(error)); return false; }
    finally { setActionBusy(false); }
  };

  const toggleStudent = (studentId: string) => setSelectedStudentIds((current) => current.includes(studentId) ? current.filter((idValue) => idValue !== studentId) : [...current, studentId]);
  const submitBulk = () => {
    const codes = studentCodes.split(/[\s,;]+/).map((value) => value.trim()).filter(Boolean);
    if (!selectedStudentIds.length && !codes.length) { setActionError('Chọn sinh viên hoặc nhập mã sinh viên trước khi thêm.'); return; }
    void runAction(async () => {
      const extra = Math.max(0, Number(bulkExtraAttempts) || 0);
      const identifiers = [...selectedStudentIds, ...codes];
      const result = await detail.addStudents({ studentIds: selectedStudentIds, studentCodes: codes, ...(extra > 0 ? { extraAttemptsByIdentifier: Object.fromEntries(identifiers.map((identifier) => [identifier, extra])) } : {}) });
      setBulkResult(result); setSelectedStudentIds([]); setStudentCodes(''); setBulkExtraAttempts('0');
    }, detail.loadReadiness);
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await runAction(async () => setBulkResult(await detail.importStudents(file)), detail.loadReadiness);
    event.target.value = '';
  };

  const previewSchedule = () => {
    const startTime = dateTimeLocalToOffset(scheduleStart);
    if (!startTime || Number(slotMinutes) < 1) { setActionError('Nhập giờ bắt đầu và thời lượng slot hợp lệ.'); return; }
    setSchedulePreview(null);
    void runAction(async () => setSchedulePreview(await detail.autoSchedule({ startTime, shuffle, seed: seed ? Number(seed) : null, slotMinutes: Number(slotMinutes), dryRun: true, attemptNo: Math.max(1, Number(scheduleAttemptNo) || 1) })));
  };

  const applySchedule = () => {
    const startTime = dateTimeLocalToOffset(scheduleStart);
    if (!startTime) return;
    void runAction(async () => {
      await detail.autoSchedule({ startTime, shuffle, seed: seed ? Number(seed) : null, slotMinutes: Number(slotMinutes), dryRun: false, attemptNo: Math.max(1, Number(scheduleAttemptNo) || 1) });
      setSchedulePreview(null);
    }, () => detail.loadStudents({ page: studentPage, size: 50 }));
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
    const confirmed = window.confirm(hasActiveAttempts ? 'Phiên đang có sinh viên thi. Bạn xác nhận hủy phiên?' : 'Xác nhận hủy phiên thi?');
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
      {session.status !== 'CANCELLED' && <button type="button" className="exam-danger-action" disabled={!canWrite || actionBusy || Boolean(session.attemptCount || session.statistics?.completedCount || assignments.some(hasAttempt))} onClick={removeSession}>Xóa</button>}
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
      <section className="exam-attempt-settings" aria-labelledby="attempt-settings-title"><h3 id="attempt-settings-title">Số lượt thi</h3>{attemptSettingsError && <p className="exam-inline-error" role="alert">{t(attemptSettingsError)}</p>}{!attemptSettings && !attemptSettingsError && <p role="status">Đang tải cấu hình lượt thi…</p>}{attemptSettings && <><div className="exam-add-controls"><label>Số lượt tối đa<input type="number" min="1" value={attemptSettings.maxAttempts} onChange={(event) => { const maxAttempts = Math.max(1, Number(event.target.value) || 1); setSettingsWarning(false); setAttemptSettings({ ...attemptSettings, maxAttempts, affectedStudents: assignments.filter((student) => (student.attemptsUsed ?? 0) > maxAttempts).map((student) => ({ studentId: student.studentId, studentName: student.studentName, attemptsUsed: student.attemptsUsed ?? 0 })) }); }} /></label><label>Chính sách điểm<select value={attemptSettings.scorePolicy} onChange={(event) => setAttemptSettings({ ...attemptSettings, scorePolicy: event.target.value as ExamScorePolicy })}>{(['LATEST','HIGHEST','FIRST','AVERAGE','LECTURER_CHOOSES'] as ExamScorePolicy[]).map((policy) => <option key={policy} value={policy}>{policy}</option>)}</select></label><label>Thời gian chờ (phút)<input type="number" min="0" value={attemptSettings.cooldownMinutes} onChange={(event) => setAttemptSettings({ ...attemptSettings, cooldownMinutes: Math.max(0, Number(event.target.value) || 0) })} /></label><label>Khung giờ bắt đầu<input type="datetime-local" value={attemptSettings.attemptWindowStart ? attemptSettings.attemptWindowStart.slice(0,16) : ''} onChange={(event) => setAttemptSettings({ ...attemptSettings, attemptWindowStart: event.target.value ? dateTimeLocalToOffset(event.target.value) : null })} /></label><label>Khung giờ kết thúc<input type="datetime-local" value={attemptSettings.attemptWindowEnd ? attemptSettings.attemptWindowEnd.slice(0,16) : ''} onChange={(event) => setAttemptSettings({ ...attemptSettings, attemptWindowEnd: event.target.value ? dateTimeLocalToOffset(event.target.value) : null })} /></label><label className="exam-inline-check"><input type="checkbox" checked={attemptSettings.avoidRepeatQuestions} onChange={(event) => setAttemptSettings({ ...attemptSettings, avoidRepeatQuestions: event.target.checked })} /> Tránh lặp câu hỏi</label><label className="exam-inline-check"><input type="checkbox" checked={attemptSettings.allowLecturerExtraAttempts} onChange={(event) => setAttemptSettings({ ...attemptSettings, allowLecturerExtraAttempts: event.target.checked })} /> Cho phép cấp thêm lượt</label><button type="button" className="exam-primary-action" disabled={!canWrite || actionBusy} onClick={() => void saveAttemptSettings()}>Lưu cấu hình lượt</button></div>{settingsWarning && <div className="exam-inline-error" role="alert"><p>Giảm giới hạn không xóa các lượt đã sử dụng. Sinh viên sau đây đã vượt giới hạn mới:</p><ul>{attemptSettings.affectedStudents.map((student) => <li key={student.studentId}>{student.studentName ?? student.studentId}: {student.attemptsUsed}</li>)}</ul><button type="button" className="exam-primary-action" onClick={() => void saveAttemptSettings()}>Xác nhận lưu</button></div>}</>}</section>
      <div className="exam-add-controls">
        <label>Tìm sinh viên<select aria-label="Chọn sinh viên" value="" onChange={(event) => { if (event.target.value) toggleStudent(event.target.value); }}><option value="">Chọn để thêm...</option>{activeStudents.students.filter((student) => !assignments.some((assignment) => assignment.studentId === student.userId)).map((student) => <option key={student.userId} value={student.userId}>{student.fullName} · {student.studentOrStaffCode}</option>)}</select></label>
        <label>Tìm danh sách<input type="search" value={studentKeyword} onChange={(event) => setStudentKeyword(event.target.value)} placeholder="Tên, email hoặc mã SV" /></label>
        <label>Mã sinh viên<textarea rows={2} value={studentCodes} onChange={(event) => setStudentCodes(event.target.value)} placeholder="Nhập nhiều mã, cách nhau bằng dấu phẩy hoặc xuống dòng" /></label>
        <label>Lượt thêm mỗi sinh viên<input type="number" min="0" value={bulkExtraAttempts} onChange={(event) => setBulkExtraAttempts(event.target.value)} /></label>
        <button type="button" className="exam-primary-action" disabled={!canWrite || actionBusy} onClick={submitBulk}>Thêm sinh viên</button>
        <label className="exam-file-control">Import CSV/XLSX<input type="file" accept=".csv,.xlsx" disabled={!canWrite || actionBusy} onChange={(event) => void importFile(event)} /></label>
      </div>
      {activeStudents.loading && <p className="field-hint" role="status">Đang tìm sinh viên...</p>}
      {activeStudents.error && <div className="exam-inline-error" role="alert">{activeStudents.error}<button type="button" className="text-action" onClick={activeStudents.retry}>Thử lại</button></div>}
      {selectedStudentIds.length > 0 && <p className="field-hint">Đã chọn {selectedStudentIds.length} sinh viên: {selectedStudentIds.map((studentId) => activeStudents.students.find((student) => student.userId === studentId)?.fullName ?? studentId).join(', ')}</p>}
      {bulkResult && <section className="exam-import-result" aria-live="polite"><strong>Đã thêm {bulkResult.added.length} sinh viên · Bỏ qua {bulkResult.skipped.length}</strong>{bulkResult.skipped.length > 0 && <div className="exam-table-scroll"><table className="exam-student-table"><thead><tr><th>Mã/định danh</th><th>Dòng</th><th>Lý do</th></tr></thead><tbody>{bulkResult.skipped.map((item, index) => <tr key={`${item.identifier}-${index}`}><td>{item.identifier}</td><td>{item.row ?? '—'}</td><td>{item.reason}</td></tr>)}</tbody></table></div>}</section>}
      <div className="exam-auto-schedule"><h3>Tự xếp lịch</h3><div className="exam-add-controls"><label>Lượt thi<input type="number" min="1" value={scheduleAttemptNo} onChange={(event) => setScheduleAttemptNo(event.target.value)} /></label><label>Giờ bắt đầu<input type="datetime-local" value={scheduleStart} onChange={(event) => setScheduleStart(event.target.value)} /></label><label>Thời lượng slot (phút)<input type="number" min="1" value={slotMinutes} onChange={(event) => setSlotMinutes(event.target.value)} /></label><label>Seed tùy chọn<input type="number" value={seed} onChange={(event) => setSeed(event.target.value)} /></label><label className="exam-inline-check"><input type="checkbox" checked={shuffle} onChange={(event) => setShuffle(event.target.checked)} /> Trộn thứ tự</label><button type="button" className="exam-outline-action" disabled={!canWrite || actionBusy} onClick={previewSchedule}>Xem trước</button></div>
        {schedulePreview && <><div className="exam-table-scroll"><table className="exam-student-table"><thead><tr><th>Slot</th><th>Sinh viên</th><th>Giờ dự kiến</th><th>Xung đột</th></tr></thead><tbody>{schedulePreview.items.map((item) => <tr key={`${item.studentId}-${item.slotOrder}`}><td>{item.slotOrder}</td><td>{item.studentName ?? item.studentCode ?? item.studentId}</td><td>{formatExamDateTime(item.scheduledTime)}</td><td>{item.conflict || '—'}</td></tr>)}</tbody></table></div><div className="exam-student-actions"><span>{schedulePreview.items.length} suất dự kiến</span><button type="button" className="exam-primary-action" disabled={!canWrite || actionBusy || schedulePreview.items.some((item) => item.conflict)} onClick={applySchedule}>Áp dụng lịch</button></div></>}</div>
      {detail.studentsError && <div className="exam-inline-error" role="alert">{detail.studentsError}<button type="button" className="text-action" onClick={() => void detail.loadStudents({ page: studentPage, size: 50 })}>Thử lại</button></div>}
      {detail.studentsLoading && <p className="exam-state" role="status">Đang tải sinh viên...</p>}
      <div className="exam-list-filters exam-student-filter"><label>Trạng thái<select value={studentStatus} onChange={(event) => { setStudentStatus(event.target.value); setStudentPage(0); }}><option value="">Tất cả trạng thái</option>{Object.entries(STUDENT_SESSION_STATUS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></label></div>
      {!detail.studentsLoading && assignments.length === 0 && <div className="exam-empty" role="status">Chưa có sinh viên trong phiên.</div>}
      {assignments.length > 0 && <div className="exam-table-scroll"><table className="exam-student-table"><thead><tr><th>Slot</th><th>Sinh viên</th><th>Trạng thái</th><th>Giờ thi</th><th>Lượt thi</th><th>Điểm AI</th><th>Điểm chốt</th><th>Thao tác</th></tr></thead><tbody>{assignments.map((student) => { const presentation = STUDENT_SESSION_STATUS[student.status] ?? { label: student.status, color: 'gray' }; const time = editTime[student.studentId] ?? (student.scheduledTime ? new Date(new Date(student.scheduledTime).getTime() - new Date(student.scheduledTime).getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : ''); const attempts = student.attempts ?? (student.currentAttempt ? [student.currentAttempt] : []); const expanded = expandedStudentId === student.studentId; return <><tr key={student.assignmentId}><td>{student.slotOrder ?? '—'}</td><td><strong>{student.studentName}</strong><small>{student.studentCode} · {student.studentEmail}</small></td><td><span className={`exam-badge ${presentation.color}`}>{presentation.label}</span></td><td><input aria-label={`Giờ thi của ${student.studentName}`} type="datetime-local" value={time} onChange={(event) => setEditTime((current) => ({ ...current, [student.studentId]: event.target.value }))} /></td><td><button type="button" className="text-action" aria-expanded={expanded} onClick={() => setExpandedStudentId(expanded ? null : student.studentId)}>{student.attemptsUsed ?? (student.attemptId ? 1 : 0)} / {student.attemptsAllowed ?? attemptSettings?.maxAttempts ?? 1} · {student.currentAttempt?.status ?? student.attemptStatus ?? '—'}</button></td><td>{student.aiScore ?? '—'}</td><td>{student.finalScore ?? student.totalScore ?? '—'}</td><td><div className="exam-student-actions">{time && <button type="button" className="text-action" disabled={!canWrite || actionBusy} onClick={() => { const iso = dateTimeLocalToOffset(time); if (iso) void runAction(() => detail.updateSchedule(student.studentId, iso)); }}>Lưu giờ</button>}<button type="button" className="text-action" disabled={!canWrite || actionBusy} onClick={() => { setAttemptAction({ studentId: student.studentId, kind: 'grant' }); setAttemptActionReason(''); }}>Cấp lượt</button><button type="button" className="text-action" disabled={!canWrite || actionBusy || !(student.extraAttempts ?? 0)} onClick={() => { setAttemptAction({ studentId: student.studentId, kind: 'revoke' }); setAttemptActionReason(''); }}>Thu hồi lượt</button><button type="button" className="text-action" disabled={!canWrite || actionBusy} onClick={() => { setAttemptAction({ studentId: student.studentId, kind: 'schedule' }); setAttemptActionReason(''); }}>Xếp lượt tiếp</button></div></td></tr>{expanded && <tr key={`${student.assignmentId}-attempts`}><td colSpan={8}><div className="exam-attempt-list">{attempts.map((attempt) => <div key={attempt.examAttemptId} className="exam-attempt-item"><strong>Lượt {attempt.attemptNo}</strong><span>{attempt.scheduledTime ? formatExamDateTime(attempt.scheduledTime) : 'Chưa xếp lịch'}</span><span>{attempt.status} · {attempt.counted ? 'Đã tính' : 'Chưa tính'}{attempt.voided ? ' · Đã vô hiệu hóa (lưu lịch sử)' : ''}</span><span>Gợi ý AI: {attempt.aiSuggestedTotal ?? '—'}</span><span>Điểm cuối: {attempt.finalTotal ?? '—'}</span>{student.officialResult?.officialAttemptId === attempt.examAttemptId && <strong>Kết quả chính thức</strong>}{attempt.status === 'SCHEDULED' && !attempt.counted && <button type="button" className="text-action danger" onClick={() => { setAttemptAction({ studentId: student.studentId, kind: 'reason', action: 'cancel', attemptId: attempt.examAttemptId }); setAttemptActionReason(''); }}>Hủy lịch</button>} {!attempt.voided && <button type="button" className="text-action danger" onClick={() => { setAttemptAction({ studentId: student.studentId, kind: 'reason', action: 'void', attemptId: attempt.examAttemptId }); setAttemptActionReason(''); }}>Vô hiệu hóa</button>}{attemptSettings?.scorePolicy === 'LECTURER_CHOOSES' && attempt.finalTotal != null && !attempt.voided && <button type="button" className="text-action" onClick={() => { if (window.confirm('Chọn lượt này làm kết quả chính thức?')) void runAction(() => selectOfficialAttempt(id, student.studentId, attempt.examAttemptId), () => detail.loadStudents({ page: studentPage, size: 50 })); }}>Chọn chính thức</button>}</div>)}</div></td></tr>}</>; })}</tbody></table></div>}
      {(detail.students?.totalPages ?? 0) > 1 && <nav className="exam-pagination" aria-label="Phân trang sinh viên"><button type="button" disabled={studentPage <= 0} onClick={() => setStudentPage((value) => value - 1)}>Trước</button><span>Trang {studentPage + 1} / {detail.students?.totalPages}</span><button type="button" disabled={studentPage + 1 >= (detail.students?.totalPages ?? 0)} onClick={() => setStudentPage((value) => value + 1)}>Sau</button></nav>}
    </section>}

    {tab === 'students' && <section className="exam-detail-panel" aria-labelledby="attempt-audit-title"><div className="exam-list-heading"><div><h2 id="attempt-audit-title">Lịch sử kiểm toán lượt thi</h2><p>Các thao tác được lưu cùng lý do, không xóa lịch sử lượt.</p></div><button type="button" className="exam-outline-action" onClick={() => void loadAttemptAudit()}>Tải kiểm toán</button></div>{auditError && <p role="alert">{auditError}</p>}{attemptAudit && (attemptAudit.length ? <div className="exam-table-scroll"><table className="exam-student-table"><thead><tr><th>Thời điểm</th><th>Lượt</th><th>Hành động</th><th>Lý do</th><th>Người thực hiện</th></tr></thead><tbody>{attemptAudit.map((record, index) => <tr key={record.auditId ?? `${record.examAttemptId}-${index}`}><td>{formatExamDateTime(record.createdAt)}</td><td>{record.attemptNo ?? record.examAttemptId}</td><td>{record.action}</td><td>{record.reason ?? '—'}</td><td>{record.actorName ?? '—'}</td></tr>)}</tbody></table></div> : <p role="status">Chưa có bản ghi kiểm toán lượt thi.</p>)}</section>}

    {tab === 'plan' && <section className="exam-detail-panel" role="tabpanel"><div className="exam-list-heading"><div><h2>Bộ đề & trùng lặp</h2><p>Xem thứ tự câu hỏi theo từng lượt thi.</p></div><button type="button" className="exam-outline-action" onClick={() => void detail.loadUsage()}>Làm mới</button></div>
      <label className="exam-plan-select-label">Sinh viên có lượt thi<select className="exam-plan-select" value={planStudentId} onChange={(event) => setPlanStudentId(event.target.value)}><option value="">Chọn sinh viên</option>{assignments.filter((item) => item.attemptId).map((item) => <option key={item.studentId} value={item.studentId}>{item.studentName} · {item.studentCode}</option>)}</select></label>
      {planLoading && <p className="exam-state" role="status">Đang tải bộ câu hỏi...</p>}{planError && <div className="exam-inline-error" role="alert">{planError}</div>}
      {plan && <div className="exam-table-scroll"><h3>{plan.totalQuestions} câu trong bộ đề</h3><table className="exam-student-table"><thead><tr><th>Thứ tự</th><th>Bloom</th><th>Câu hỏi</th></tr></thead><tbody>{plan.questions.map((question, index) => { const bloom = BLOOM_PRESENTATION[question.bloomLevel as keyof typeof BLOOM_PRESENTATION]; return <tr key={question.questionId}><td>{question.position ?? question.order ?? index + 1}</td><td>{bloom ? <span className={`exam-bloom-badge ${bloom.color}`}>{bloom.label}</span> : question.bloomLevel}</td><td>{question.questionText}</td></tr>; })}</tbody></table></div>}
      {detail.usageLoading && <p className="exam-state" role="status">Đang tải thống kê câu hỏi...</p>}{detail.usageError && <div className="exam-inline-error" role="alert">{detail.usageError}<button type="button" className="text-action" onClick={() => void detail.loadUsage()}>Thử lại</button></div>}
      {detail.usage && <><div className={`exam-repeat-count ${detail.usage.adjacentRepeatPairs === 0 ? 'ok' : 'warn'}`} aria-live="polite">Cặp liền kề trùng: {detail.usage.adjacentRepeatPairs}</div><div className="exam-table-scroll"><table className="exam-usage-table"><thead><tr><th>Câu hỏi</th><th>Bloom</th><th>Số lần dùng</th><th>Sinh viên</th></tr></thead><tbody>{detail.usage.usage.map((item) => { const bloom = BLOOM_PRESENTATION[item.bloomLevel as keyof typeof BLOOM_PRESENTATION]; return <tr key={item.questionId}><td>{item.questionText || item.questionId}</td><td>{bloom ? <span className={`exam-bloom-badge ${bloom.color}`}>{bloom.label}</span> : item.bloomLevel ?? '—'}</td><td>{item.usageCount}</td><td>{item.students?.map((student) => `${student.studentName}${student.studentCode ? ` (${student.studentCode})` : ''}`).join(', ') || '—'}</td></tr>; })}</tbody></table></div></>}
    </section>}

    {attemptAction && <div className="exam-modal-backdrop" role="presentation"><section className="exam-modal" role="alertdialog" aria-modal="true" aria-labelledby="attempt-action-title"><h2 id="attempt-action-title">{attemptAction.kind === 'grant' ? 'Cấp thêm lượt thi' : attemptAction.kind === 'revoke' ? 'Thu hồi lượt chưa dùng' : attemptAction.kind === 'schedule' ? 'Xếp lịch lượt mới' : attemptAction.action === 'void' ? 'Vô hiệu hóa lượt thi' : 'Hủy lịch lượt thi'}</h2>{attemptAction.action === 'void' && <p className="field-hint invalid">Lượt sẽ được giữ trong lịch sử và kiểm toán, nhưng không còn được tính.</p>}{attemptAction.kind === 'reason' && <label>Lý do<textarea rows={3} value={attemptActionReason} onChange={(event) => setAttemptActionReason(event.target.value)} /></label>}{['grant','revoke'].includes(attemptAction.kind) && <><label>Số lượt<input type="number" min="1" value={attemptActionCount} onChange={(event) => setAttemptActionCount(event.target.value)} /></label><label>Lý do<textarea rows={3} value={attemptActionReason} onChange={(event) => setAttemptActionReason(event.target.value)} /></label></>}{attemptAction.kind === 'schedule' && <label>Giờ thi<input type="datetime-local" value={attemptScheduleTime} onChange={(event) => setAttemptScheduleTime(event.target.value)} /></label>}<div className="exam-modal-actions"><button type="button" className="exam-outline-action" onClick={() => setAttemptAction(null)}>Hủy</button><button type="button" className="exam-primary-action" disabled={!canWrite || actionBusy || (attemptAction.kind === 'schedule' ? !dateTimeLocalToOffset(attemptScheduleTime) : !attemptActionReason.trim())} onClick={() => void submitAttemptAction()}>Xác nhận</button></div></section></div>}
    {cancelOpen && <div className="exam-modal-backdrop" role="presentation"><section className="exam-modal" role="alertdialog" aria-modal="true" aria-labelledby="cancel-session-title"><h2 id="cancel-session-title">Hủy phiên thi</h2>{hasActiveAttempts && <p className="field-hint invalid">Có sinh viên đang thi. Việc hủy có thể làm gián đoạn phiên.</p>}<label>Lý do hủy<textarea rows={3} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} /></label><div className="exam-modal-actions"><button type="button" className="exam-outline-action" onClick={() => setCancelOpen(false)}>Quay lại</button><button type="button" className="exam-danger-action" disabled={!canWrite || actionBusy || !cancelReason.trim()} onClick={submitCancel}>Xác nhận hủy</button></div></section></div>}
  </main>;
}
