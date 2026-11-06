import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import { createExamSession, getExamSession, getExamSessionError, getExamSessionStudents, updateExamSession } from '../../../api/examSessionApi';
import useExamTopics from '../../../hooks/useExamTopics';
import { useAuth } from '../../../hooks/useAuth';
import type { CreateExamSessionRequest, ExamSessionStatus, UpdateExamSessionRequest } from '../../../types/exam';
import type { BloomLevel } from '../../../types/rubric';
import { BLOOM_ORDER, BLOOM_PRESENTATION, dateTimeLocalToOffset, missingBloomEntries, normalizeBloomDistribution, SESSION_STATUS, validateBloomDistribution } from '../../../utils/examSession';
import './CreateExamPage.css';
import './ExamManagementExtras.css';

type FormState = {
  topicId: string;
  sessionName: string;
  maxMainQuestions: string;
  maxFollowupPerQuestion: string;
  timeLimitMinutes: string;
  startTime: string;
  bufferMinutes: string;
  avoidRepeatWindow: string;
  maxOverlapPercent: string;
  description: string;
  bloomEnabled: boolean;
  bloomDistribution: Record<BloomLevel, string>;
};

const freshDistribution = (): Record<BloomLevel, string> => ({ REMEMBER: '1', UNDERSTAND: '1', APPLY: '1', ANALYZE: '0', EVALUATE: '0', CREATE: '0' });
const initialForm = (): FormState => ({
  topicId: '', sessionName: '', maxMainQuestions: '3', maxFollowupPerQuestion: '2', timeLimitMinutes: '15',
  startTime: '', bufferMinutes: '0', avoidRepeatWindow: '0', maxOverlapPercent: '40', description: '', bloomEnabled: false, bloomDistribution: freshDistribution(),
});

export default function CreateExamPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = ['ADMIN', 'AD'].includes(String(user?.role ?? '').toUpperCase());
  const root = isAdmin ? '/admin/exam-sessions' : '/lecturer/exam-sessions';
  const canWrite = ['ADMIN', 'LECTURER', 'AD', 'LE'].includes(String(user?.role ?? '').toUpperCase());
  const topics = useExamTopics();
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<ExamSessionStatus>('SCHEDULED');
  const [loading, setLoading] = useState(Boolean(id));
  const [hasAttempts, setHasAttempts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [missingLevels, setMissingLevels] = useState<Array<{ level: string; count: number }>>([]);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!id) return undefined;
    const controller = new AbortController();
    setLoading(true); setError('');
    Promise.all([getExamSession(id, controller.signal), getExamSessionStudents(id, { page: 0, size: 100 }, controller.signal)])
      .then(([session, assignmentPage]) => {
        if (controller.signal.aborted) return;
        const distribution = freshDistribution();
        Object.entries(normalizeBloomDistribution(session.bloomDistribution)).forEach(([level, count]) => {
          if (BLOOM_ORDER.includes(level as BloomLevel)) distribution[level as BloomLevel] = String(count);
        });
        setStatus(session.status as ExamSessionStatus);
        setHasAttempts(Boolean(session.attemptCount || session.statistics?.completedCount || assignmentPage.content.some((item) => item.attemptId || item.attemptStatus)));
        setForm({
          topicId: session.topicId,
          sessionName: session.sessionName,
          maxMainQuestions: String(session.maxMainQuestions),
          maxFollowupPerQuestion: String(session.maxFollowupPerQuestion),
          timeLimitMinutes: String(session.timeLimitMinutes),
          startTime: session.startTime ? new Date(session.startTime).toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).replace(' ', 'T').slice(0, 16) : '',
          bufferMinutes: String(session.bufferMinutes ?? 0),
          avoidRepeatWindow: String(session.avoidRepeatWindow ?? 0),
          maxOverlapPercent: String(session.maxOverlapPercent ?? 40),
          description: session.description ?? '',
          bloomEnabled: Boolean(session.bloomDistribution),
          bloomDistribution: distribution,
        });
      })
      .catch((requestError) => { if (!controller.signal.aborted) setError(getExamSessionError(requestError, 'Không thể tải phiên thi.')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);

  const mainCount = Number(form.maxMainQuestions) || 0;
  const parsedDistribution = useMemo(() => Object.fromEntries(BLOOM_ORDER.map((level) => [level, Number(form.bloomDistribution[level]) || 0])) as Record<BloomLevel, number>, [form.bloomDistribution]);
  const distributionCheck = validateBloomDistribution(parsedDistribution, mainCount);
  const locked = Boolean(id && hasAttempts);
  const editable = !id || status === 'SCHEDULED';
  const change = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(''); setSuccess('');
    if (!canWrite) { setError('Không có quyền thực hiện thao tác này.'); return; }
    if (!editable) { setError('Chỉ có thể sửa phiên đang ở trạng thái Đã lên lịch.'); return; }
    if (!form.topicId) { setError('Vui lòng chọn môn/chủ đề.'); return; }
    const maxMainQuestions = Number(form.maxMainQuestions);
    const maxFollowupPerQuestion = Number(form.maxFollowupPerQuestion);
    const timeLimitMinutes = Number(form.timeLimitMinutes);
    const bufferMinutes = Number(form.bufferMinutes);
    const avoidRepeatWindow = Number(form.avoidRepeatWindow);
    const maxOverlapPercent = Number(form.maxOverlapPercent);
    if (!form.sessionName.trim() || maxMainQuestions < 1 || maxFollowupPerQuestion < 0 || timeLimitMinutes < 1 || timeLimitMinutes > 180 || bufferMinutes < 0 || avoidRepeatWindow < 0 || maxOverlapPercent < 0 || maxOverlapPercent > 100) {
      setError('Vui lòng kiểm tra tên phiên, số câu, thời lượng 1–180 phút và các khoảng thời gian.'); return;
    }
    if (form.bloomEnabled && !distributionCheck.valid) { setError(`Tổng phân bố Bloom phải bằng ${mainCount} câu và mỗi mức là số nguyên không âm.`); return; }
    const startTime = dateTimeLocalToOffset(form.startTime);
    if (form.startTime && !startTime) { setError('Giờ bắt đầu không hợp lệ.'); return; }
    const base = {
      topicId: form.topicId,
      sessionName: form.sessionName.trim(),
      maxMainQuestions,
      maxFollowupPerQuestion,
      timeLimitMinutes,
      startTime: startTime ?? undefined,
      bufferMinutes,
      avoidRepeatWindow,
      maxOverlapPercent,
      description: form.description.trim() || undefined,
      bloomDistribution: form.bloomEnabled ? parsedDistribution : undefined,
    };
    setSaving(true); setMissingLevels([]);
    try {
      const result = id
        ? await updateExamSession(id, { ...base, status } satisfies UpdateExamSessionRequest)
        : await createExamSession(base satisfies CreateExamSessionRequest);
      setSuccess(id ? 'Đã cập nhật phiên thi.' : 'Đã tạo phiên thi.');
      if (!id) navigate(`${root}/${encodeURIComponent(result.sessionId)}`, { replace: true });
    } catch (requestError) {
      setError(getExamSessionError(requestError));
      setMissingLevels(missingBloomEntries(requestError));
    } finally { setSaving(false); }
  };

  return <main className="exam-session-page">
    <PageHeader title={id ? 'Sửa phiên thi' : 'Tạo phiên thi'} description="Cấu hình chủ đề, thời lượng và cấu trúc câu hỏi của phiên." />
    {import.meta.env.VITE_USE_MOCK_EXAMS === 'true' && <p className="exam-mock-label" role="status">Dữ liệu mẫu</p>}
    {!canWrite && <p className="readonly-notice" role="status">Tài khoản ST chỉ được xem. Thao tác ghi đã bị khóa.</p>}
    {loading && <p className="loading-message" role="status">Đang tải phiên thi...</p>}
    {(topics.error) && <div className="inline-error" role="alert">{topics.error}<button type="button" className="link-button" onClick={topics.retry}>Thử lại</button></div>}
    {error && <div className="inline-error" role="alert">{error}<button type="button" className="link-button" onClick={() => setError('')}>Đóng</button></div>}
    {missingLevels.length > 0 && <section className="exam-missing-bank" aria-label="Mức Bloom thiếu câu hỏi"><strong>Câu hỏi còn thiếu theo Bloom</strong><ul>{missingLevels.map((item) => <li key={item.level}>{BLOOM_PRESENTATION[item.level as BloomLevel]?.label ?? item.level}: thiếu {item.count} câu</li>)}</ul></section>}
    {success && <p className="success-message" role="status">{success}</p>}
    {locked && <p className="readonly-notice" role="status">Phiên đã có lượt thi. Chủ đề, số câu chính và phân bố Bloom được khóa.</p>}
    {!editable && <p className="readonly-notice" role="status">Phiên không còn ở trạng thái Đã lên lịch nên không thể sửa.</p>}
    {!loading && <form className="exam-session-form" onSubmit={submit}>
      <label className="wide">Môn/chủ đề<select required value={form.topicId} disabled={topics.loading || !canWrite || !editable || locked} onChange={(event) => change('topicId', event.target.value)}><option value="">Chọn môn/chủ đề</option>{topics.topics.map((topic) => <option key={topic.topicId} value={topic.topicId}>{[topic.subjectName, topic.topicCode, topic.topicName].filter(Boolean).join(' · ')}</option>)}</select></label>
      <label>Tên phiên thi<input required maxLength={200} value={form.sessionName} disabled={!canWrite || !editable} onChange={(event) => change('sessionName', event.target.value)} /></label>
      {id && <div className="exam-readonly-status"><span>Trạng thái</span><strong>{SESSION_STATUS[status]?.label ?? status}</strong></div>}
      <label>Số câu chính<input required type="number" min="1" step="1" value={form.maxMainQuestions} disabled={!canWrite || !editable || locked} onChange={(event) => change('maxMainQuestions', event.target.value)} /></label>
      <label>Số câu xoáy tối đa<input required type="number" min="0" step="1" value={form.maxFollowupPerQuestion} disabled={!canWrite || !editable || locked} onChange={(event) => change('maxFollowupPerQuestion', event.target.value)} /></label>
      <label>Thời lượng mỗi thí sinh (phút)<input required type="number" min="1" max="180" step="1" value={form.timeLimitMinutes} disabled={!canWrite || !editable} onChange={(event) => change('timeLimitMinutes', event.target.value)} /></label>
      <label>Buffer giữa thí sinh (phút)<input type="number" min="0" step="1" value={form.bufferMinutes} disabled={!canWrite || !editable} onChange={(event) => change('bufferMinutes', event.target.value)} /></label>
      <label>Cửa sổ tránh trùng câu<input type="number" min="0" step="1" value={form.avoidRepeatWindow} disabled={!canWrite || !editable || locked} onChange={(event) => change('avoidRepeatWindow', event.target.value)} /></label>
      <label>Giới hạn trùng câu hỏi giữa sinh viên (%)<input required type="number" min="0" max="100" step="1" value={form.maxOverlapPercent} disabled={!canWrite || !editable || locked} onChange={(event) => change('maxOverlapPercent', event.target.value)} /><small>Tối đa {Math.floor(mainCount * (Number(form.maxOverlapPercent) || 0) / 100)} câu chính trùng giữa hai sinh viên.</small></label>
      <label>Giờ bắt đầu<input type="datetime-local" value={form.startTime} disabled={!canWrite || !editable} onChange={(event) => change('startTime', event.target.value)} /></label>
      <label className="wide">Mô tả<textarea rows={3} value={form.description} disabled={!canWrite || !editable} onChange={(event) => change('description', event.target.value)} /></label>
      <fieldset className="exam-bloom-fieldset wide" disabled={!canWrite || !editable || locked}>
        <legend>Phân bố Bloom (tùy chọn)</legend>
        <label className="exam-bloom-toggle"><input type="checkbox" checked={form.bloomEnabled} onChange={(event) => change('bloomEnabled', event.target.checked)} /> Chỉ định số câu cho từng mức</label>
        {!form.bloomEnabled ? <p className="field-hint">Hệ thống tự rải đều từ mức thấp lên cao.</p> : <>
          <div className="exam-bloom-grid">{BLOOM_ORDER.map((level) => <label key={level}><span className={`exam-bloom-label ${BLOOM_PRESENTATION[level].color}`}>{BLOOM_PRESENTATION[level].label}</span><input aria-label={`${BLOOM_PRESENTATION[level].label} (${level})`} type="number" min="0" step="1" value={form.bloomDistribution[level]} onChange={(event) => change('bloomDistribution', { ...form.bloomDistribution, [level]: event.target.value })} /></label>)}</div>
          <p className={`field-hint ${distributionCheck.valid ? 'valid' : 'invalid'}`} aria-live="polite">Tổng: {distributionCheck.total} / {distributionCheck.expected} câu</p>
        </>}
      </fieldset>
      <div className="form-actions"><button type="button" className="secondary-button" onClick={() => navigate(-1)}>Quay lại</button><button type="submit" className="primary-button" disabled={!canWrite || !editable || saving || (form.bloomEnabled && !distributionCheck.valid)}>{saving ? 'Đang lưu...' : id ? 'Lưu thay đổi' : 'Tạo phiên thi'}</button></div>
    </form>}
  </main>;
}
