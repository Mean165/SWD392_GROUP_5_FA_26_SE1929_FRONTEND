import { useEffect, useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { getExamSessions } from '../../../api/examSessionApi';
import { getLecturerOfficialExamResults } from '../../../services/report/reportService';
import type { ExamSessionResponse, StudentSessionAssignmentResponse } from '../../../types/exam';
import './ClassReportPage.css';

export default function ClassReportPage() {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<ExamSessionResponse[]>([]);
  const [examId, setExamId] = useState('');
  const [rows, setRows] = useState<StudentSessionAssignmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getExamSessions({ page: 0, size: 100 }).then((page) => { if (active) setSessions(page.content); })
      .catch(() => { if (active) setError(t('Không thể tải kỳ thi.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [t]);

  useEffect(() => {
    if (!examId) { setRows([]); return undefined; }
    let active = true;
    setLoading(true); setError('');
    getLecturerOfficialExamResults(examId).then((result) => { if (active) setRows(result.content); })
      .catch(() => { if (active) setError(t('Không thể tải kết quả chính thức.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [examId, t]);

  return <main className="official-results-page">
    <header><h1>{t('Báo cáo kết quả chính thức')}</h1><p>{t('Kết quả được tổng hợp theo chính sách lượt thi của kỳ thi.')}</p></header>
    <label>{t('Kỳ thi')}<select value={examId} onChange={(event) => setExamId(event.target.value)}><option value="">{t('Chọn kỳ thi')}</option>{sessions.map((session) => <option key={session.sessionId} value={session.sessionId}>{session.sessionName}</option>)}</select></label>
    {loading && <p role="status">{t('Đang tải…')}</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && !error && examId && rows.length === 0 && <p role="status">{t('Chưa có kết quả chính thức.')}</p>}
    {rows.length > 0 && <div className="official-results-scroll"><table><thead><tr><th>{t('Sinh viên')}</th><th>{t('Số lượt')}</th><th>{t('Chính sách')}</th><th>{t('Lượt chính thức')}</th><th>{t('Điểm chính thức')}</th><th>{t('Trạng thái')}</th></tr></thead><tbody>{rows.map((student) => <tr key={student.assignmentId}><td>{student.studentName}<small>{student.studentCode}</small></td><td>{student.attemptsUsed ?? 0}/{student.attemptsAllowed ?? '—'}</td><td>{student.officialResult?.policy ?? '—'}</td><td>{student.officialResult?.released ? student.attempts?.find((attempt) => attempt.examAttemptId === student.officialResult?.officialAttemptId)?.attemptNo ?? '—' : '—'}</td><td>{student.officialResult?.released ? student.officialResult.total ?? '—' : t('Chưa công bố')}</td><td>{student.officialResult?.released ? t('Đã công bố') : t('Chưa công bố')}</td></tr>)}</tbody></table></div>}
  </main>;
}
