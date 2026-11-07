import { useCallback, useEffect, useState } from 'react';
import {
  addSessionStudents,
  autoScheduleStudents,
  cancelExamSession,
  deleteExamSession,
  getAttemptPlan,
  getExamSession,
  getExamSessionError,
  getExamSessionReadiness,
  getExamSessionStudents,
  getQuestionUsage,
  importSessionStudents,
  removeSessionStudent,
  startExamSession,
  updateStudentSchedule,
} from '../api/examSessionApi';
import type {
  AutoScheduleRequest,
  AutoScheduleResponse,
  BulkStudentResult,
  ExamQuestionUsage,
  ExamSessionReadiness,
  ExamSessionResponse,
  ExamSessionStudentStatus,
  PageResponse,
  StudentQuestionPlan,
  StudentSessionAssignmentResponse,
} from '../types/exam';

export default function useExamSessionDetail(sessionId: string) {
  const [session, setSession] = useState<ExamSessionResponse | null>(null);
  const [students, setStudents] = useState<PageResponse<StudentSessionAssignmentResponse> | null>(null);
  const [readiness, setReadiness] = useState<ExamSessionReadiness | null>(null);
  const [usage, setUsage] = useState<ExamQuestionUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [usageLoading, setUsageLoading] = useState(false);
  const [error, setError] = useState('');
  const [readinessError, setReadinessError] = useState('');
  const [studentsError, setStudentsError] = useState('');
  const [usageError, setUsageError] = useState('');

  const loadSession = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError('');
    try {
      const value = await getExamSession(sessionId, signal);
      if (!signal?.aborted) setSession(value);
      return value;
    } catch (requestError) {
      if (!signal?.aborted) setError(getExamSessionError(requestError, 'Không thể tải chi tiết phiên thi.'));
      return null;
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [sessionId]);

  const loadStudents = useCallback(async (query: { status?: ExamSessionStudentStatus | ''; page?: number; size?: number } = {}) => {
    setStudentsLoading(true); setStudentsError('');
    try { setStudents(await getExamSessionStudents(sessionId, query)); }
    catch (requestError) { setStudentsError(getExamSessionError(requestError, 'Không thể tải danh sách sinh viên.')); }
    finally { setStudentsLoading(false); }
  }, [sessionId]);

  const loadReadiness = useCallback(async () => {
    setReadinessLoading(true); setReadinessError('');
    try { setReadiness(await getExamSessionReadiness(sessionId)); }
    catch (requestError) { setReadinessError(getExamSessionError(requestError, 'Không thể tải trạng thái sẵn sàng.')); }
    finally { setReadinessLoading(false); }
  }, [sessionId]);

  const loadUsage = useCallback(async () => {
    setUsageLoading(true); setUsageError('');
    try { setUsage(await getQuestionUsage(sessionId)); }
    catch (requestError) { setUsageError(getExamSessionError(requestError, 'Không thể tải thống kê bộ đề.')); }
    finally { setUsageLoading(false); }
  }, [sessionId]);

  useEffect(() => { const controller = new AbortController(); void loadSession(controller.signal); return () => controller.abort(); }, [loadSession]);

  const addStudents = useCallback(async (body: { studentIds?: string[]; studentCodes?: string[]; extraAttemptsByIdentifier?: Record<string, number> }): Promise<BulkStudentResult> => {
    const result = await addSessionStudents(sessionId, body);
    await Promise.all([loadStudents(), loadSession()]);
    return result;
  }, [loadSession, loadStudents, sessionId]);

  const importStudents = useCallback(async (file: File): Promise<BulkStudentResult> => {
    const result = await importSessionStudents(sessionId, file);
    await Promise.all([loadStudents(), loadSession()]);
    return result;
  }, [loadSession, loadStudents, sessionId]);

  const removeStudent = useCallback(async (studentId: string) => {
    await removeSessionStudent(sessionId, studentId);
    await Promise.all([loadStudents(), loadSession()]);
  }, [loadSession, loadStudents, sessionId]);

  const updateSchedule = useCallback(async (studentId: string, scheduledTime: string) => {
    const result = await updateStudentSchedule(sessionId, studentId, scheduledTime);
    await loadStudents();
    return result;
  }, [loadStudents, sessionId]);

  const autoSchedule = useCallback((payload: AutoScheduleRequest): Promise<AutoScheduleResponse> => autoScheduleStudents(sessionId, payload), [sessionId]);
  const loadPlan = useCallback((attemptId: string): Promise<StudentQuestionPlan> => getAttemptPlan(sessionId, attemptId), [sessionId]);
  const start = useCallback(async () => { const value = await startExamSession(sessionId); setSession(value); return value; }, [sessionId]);
  const cancel = useCallback(async (reason: string) => { const value = await cancelExamSession(sessionId, reason); setSession(value); return value; }, [sessionId]);
  const remove = useCallback(() => deleteExamSession(sessionId), [sessionId]);
  const refreshAll = useCallback(() => Promise.all([loadSession(), loadStudents(), loadReadiness(), loadUsage()]), [loadReadiness, loadSession, loadStudents, loadUsage]);

  return {
    session, students, readiness, usage, loading, studentsLoading, readinessLoading, usageLoading,
    error, studentsError, readinessError, usageError,
    loadSession, loadStudents, loadReadiness, loadUsage, loadPlan, addStudents, importStudents,
    removeStudent, updateSchedule, autoSchedule, start, cancel, remove, refreshAll,
  };
}
