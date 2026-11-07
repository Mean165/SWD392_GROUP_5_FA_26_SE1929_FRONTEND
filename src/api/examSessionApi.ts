import axios from 'axios';
import apiClient from '../services/api/apiClient';
import { unwrapApiResponse } from '../services/api/apiResponse';
import type {
  AutoScheduleRequest,
  ExamAttemptSettings,
  ExamAttemptAuditRecord,
  ExamAttemptSummary,
  AutoScheduleResponse,
  BulkStudentResult,
  CreateExamSessionRequest,
  ExamQuestionUsage,
  ExamSessionReadiness,
  ExamSessionResponse,
  ExamSessionStudentStatus,
  PageResponse,
  StudentQuestionPlan,
  StudentSessionAssignmentResponse,
  UpdateExamSessionRequest,
} from '../types/exam';
import { BLOOM_ORDER } from '../utils/examSession';

export interface ExamSessionQuery {
  status?: string;
  topicId?: string;
  from?: string;
  to?: string;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface ExamTopicOption {
  topicId: string;
  topicCode?: string;
  topicName: string;
  subjectId?: string;
  subjectName?: string;
  description?: string | null;
}

const unwrap = <T>(response: { data: unknown }): T => unwrapApiResponse<T>(response.data);
const useMockExams = import.meta.env.VITE_USE_MOCK_EXAMS === 'true';

const mockTopics: ExamTopicOption[] = [
  { topicId: 'sample-topic-1', topicCode: 'SWD392-CORE', topicName: 'Phát triển phần mềm', subjectName: 'SWD392' },
  { topicId: 'sample-topic-2', topicCode: 'DBI202', topicName: 'Cơ sở dữ liệu', subjectName: 'DBI202' },
];
export const MOCK_ACTIVE_STUDENTS = [
  { userId: 'sample-student-3', fullName: 'Lê Chi', email: 'chi@example.test', studentOrStaffCode: 'ST0003' },
  { userId: 'sample-student-4', fullName: 'Phạm Dũng', email: 'dung@example.test', studentOrStaffCode: 'ST0004' },
  { userId: 'sample-student-5', fullName: 'Vũ Hà', email: 'ha@example.test', studentOrStaffCode: 'ST0005' },
];
let mockSessions: ExamSessionResponse[] = [{
  sessionId: 'sample-session-1', createdById: 'sample-lecturer', createdByName: 'Giảng viên mẫu', topicId: mockTopics[0].topicId,
  topicName: mockTopics[0].topicName, sessionName: 'Phiên vấn đáp mẫu', maxMainQuestions: 3, maxFollowupPerQuestion: 2,
  timeLimitMinutes: 15, bufferMinutes: 5, avoidRepeatWindow: 2, description: 'Phiên minh họa cho chế độ xem thử.',
  status: 'SCHEDULED', startTime: new Date(Date.now() + 86_400_000).toISOString(), createdAt: new Date().toISOString(),
  bloomDistribution: { REMEMBER: 1, UNDERSTAND: 1, APPLY: 1 }, statistics: { studentCount: 2, completedCount: 1, absentCount: 0 },
}];
let mockAssignments: StudentSessionAssignmentResponse[] = [
  { assignmentId: 'sample-assignment-1', sessionId: 'sample-session-1', sessionName: 'Phiên vấn đáp mẫu', studentId: 'sample-student-1', studentCode: 'ST0001', studentName: 'Nguyễn An', studentEmail: 'an@example.test', scheduledTime: new Date(Date.now() + 86_400_000).toISOString(), status: 'COMPLETED', slotOrder: 1, attemptId: 'sample-attempt-1', attemptStatus: 'COMPLETED', aiScore: 8.5, finalScore: 8 },
  { assignmentId: 'sample-assignment-2', sessionId: 'sample-session-1', sessionName: 'Phiên vấn đáp mẫu', studentId: 'sample-student-2', studentCode: 'ST0002', studentName: 'Trần Bình', studentEmail: 'binh@example.test', scheduledTime: new Date(Date.now() + 86_400_000 + 1_200_000).toISOString(), status: 'SCHEDULED', slotOrder: 2, attemptId: null, attemptStatus: null },
];

const updateMockStatistics = (sessionId: string) => {
  const session = mockSessions.find((item) => item.sessionId === sessionId);
  if (!session) return;
  const assignments = mockAssignments.filter((item) => item.sessionId === sessionId);
  session.statistics = {
    studentCount: assignments.length,
    completedCount: assignments.filter((item) => item.status === 'COMPLETED').length,
    absentCount: assignments.filter((item) => item.status === 'ABSENT').length,
  };
};

const isPage = <T>(value: unknown): value is PageResponse<T> =>
  Boolean(value && typeof value === 'object' && 'content' in value && Array.isArray((value as PageResponse<T>).content));

export const getExamSessions = async (query: ExamSessionQuery = {}, signal?: AbortSignal): Promise<PageResponse<ExamSessionResponse>> => {
  if (useMockExams) {
    const keyword = query.keyword?.trim().toLocaleLowerCase();
    const filtered = mockSessions.filter((item) => (!query.status || item.status === query.status)
      && (!query.topicId || item.topicId === query.topicId)
      && (!query.from || !item.startTime || item.startTime.slice(0, 10) >= query.from.slice(0, 10))
      && (!query.to || !item.startTime || item.startTime.slice(0, 10) <= query.to.slice(0, 10))
      && (!keyword || `${item.sessionName} ${item.topicName}`.toLocaleLowerCase().includes(keyword)));
    const page = query.page ?? 0; const size = query.size ?? 20;
    return { content: filtered.slice(page * size, (page + 1) * size), page, size, totalElements: filtered.length, totalPages: Math.ceil(filtered.length / size) };
  }
  const response = await apiClient.get('/exam-sessions', { params: query, signal });
  const data = unwrap<unknown>(response);
  if (isPage<ExamSessionResponse>(data)) return data;

  // Current Swagger returns a list; apply the requested filters and pagination client-side.
  const items = Array.isArray(data) ? data as ExamSessionResponse[] : [];
  const keyword = query.keyword?.trim().toLocaleLowerCase();
  const filtered = items.filter((item) => (
    (!query.status || item.status === query.status)
    && (!query.topicId || item.topicId === query.topicId)
    && (!query.from || !item.startTime || item.startTime >= query.from)
    && (!query.to || !item.startTime || item.startTime <= query.to)
    && (!keyword || `${item.sessionName} ${item.topicName} ${item.createdByName ?? ''}`.toLocaleLowerCase().includes(keyword))
  ));
  const page = query.page ?? 0;
  const size = query.size ?? 20;
  const visible = filtered.slice(page * size, (page + 1) * size);
  const content = await Promise.all(visible.map(async (session) => {
    if (session.statistics) return session;
    try {
      const assignments = await getExamSessionStudents(session.sessionId, { page: 0, size: 1000 }, signal);
      return {
        ...session,
        statistics: {
          studentCount: assignments.totalElements,
          completedCount: assignments.content.filter((item) => item.status === 'COMPLETED').length,
          absentCount: assignments.content.filter((item) => item.status === 'ABSENT').length,
        },
      };
    } catch {
      return session;
    }
  }));
  return { content, page, size, totalElements: filtered.length, totalPages: Math.ceil(filtered.length / size) };
};

export const getExamSession = async (sessionId: string, signal?: AbortSignal): Promise<ExamSessionResponse> => {
  if (useMockExams) {
    const session = mockSessions.find((item) => item.sessionId === sessionId);
    if (session) return { ...session };
    throw new Error('Không tìm thấy phiên thi mẫu.');
  }
  const response = await apiClient.get(`/exam-sessions/${encodeURIComponent(sessionId)}`, { signal });
  return unwrap<ExamSessionResponse>(response);
};

export const createExamSession = async (payload: CreateExamSessionRequest, signal?: AbortSignal): Promise<ExamSessionResponse> => {
  if (useMockExams) {
    const topic = mockTopics.find((item) => item.topicId === payload.topicId);
    const session: ExamSessionResponse = {
      ...payload,
      startTime: payload.startTime ?? null,
      sessionId: `sample-session-${Date.now()}`,
      createdById: 'sample-lecturer', createdByName: 'Giảng viên mẫu',
      topicName: topic?.topicName ?? payload.topicId,
      status: 'SCHEDULED', createdAt: new Date().toISOString(),
      statistics: { studentCount: 0, completedCount: 0, absentCount: 0 },
    };
    mockSessions = [session, ...mockSessions];
    return { ...session };
  }
  const response = await apiClient.post('/exam-sessions', payload, { signal });
  return unwrap<ExamSessionResponse>(response);
};

export const updateExamSession = async (sessionId: string, payload: UpdateExamSessionRequest, signal?: AbortSignal): Promise<ExamSessionResponse> => {
  if (useMockExams) {
    const index = mockSessions.findIndex((item) => item.sessionId === sessionId);
    if (index < 0) throw new Error('Không tìm thấy phiên thi mẫu.');
    const topic = mockTopics.find((item) => item.topicId === payload.topicId);
    mockSessions[index] = { ...mockSessions[index], ...payload, topicName: topic?.topicName ?? mockSessions[index].topicName };
    return { ...mockSessions[index] };
  }
  const response = await apiClient.put(`/exam-sessions/${encodeURIComponent(sessionId)}`, payload, { signal });
  return unwrap<ExamSessionResponse>(response);
};

export const deleteExamSession = async (sessionId: string): Promise<void> => {
  if (useMockExams) { mockSessions = mockSessions.filter((item) => item.sessionId !== sessionId); mockAssignments = mockAssignments.filter((item) => item.sessionId !== sessionId); return; }
  await apiClient.delete(`/exam-sessions/${encodeURIComponent(sessionId)}`);
};

export const startExamSession = async (sessionId: string): Promise<ExamSessionResponse> => {
  if (useMockExams) {
    const session = mockSessions.find((item) => item.sessionId === sessionId);
    if (!session) throw new Error('Không tìm thấy phiên thi mẫu.');
    session.status = 'IN_PROGRESS';
    return { ...session };
  }
  const response = await apiClient.post(`/exam-sessions/${encodeURIComponent(sessionId)}/start`);
  return unwrap<ExamSessionResponse>(response);
};

export const cancelExamSession = async (sessionId: string, reason: string): Promise<ExamSessionResponse> => {
  if (useMockExams) {
    const session = mockSessions.find((item) => item.sessionId === sessionId);
    if (!session) throw new Error('Không tìm thấy phiên thi mẫu.');
    session.status = 'CANCELLED'; session.description = `${session.description ?? ''} ${reason}`.trim();
    mockAssignments.filter((item) => item.sessionId === sessionId && item.status === 'SCHEDULED').forEach((item) => { item.status = 'CANCELLED'; });
    updateMockStatistics(sessionId);
    return { ...session };
  }
  const response = await apiClient.post(`/exam-sessions/${encodeURIComponent(sessionId)}/cancel`, { reason });
  return unwrap<ExamSessionResponse>(response);
};

export const getExamSessionReadiness = async (sessionId: string, signal?: AbortSignal): Promise<ExamSessionReadiness> => {
  if (useMockExams) {
    const assignments = mockAssignments.filter((item) => item.sessionId === sessionId);
    const unscheduledCount = assignments.filter((item) => !item.scheduledTime).length;
    const canStart = assignments.length > 0 && unscheduledCount === 0;
    return { ready: canStart, canStart, studentCount: assignments.length, unscheduledCount, overlappingCount: 0, approvedQuestionsByBloom: { REMEMBER: 12, UNDERSTAND: 10, APPLY: 8, ANALYZE: 6, EVALUATE: 5, CREATE: 4 }, missingQuestionsByBloom: {}, warnings: [], blockingErrors: assignments.length ? [] : ['Cần thêm sinh viên vào phiên.'], issues: [] };
  }
  const response = await apiClient.get(`/exam-sessions/${encodeURIComponent(sessionId)}/readiness`, { signal });
  return unwrap<ExamSessionReadiness>(response);
};

export const getExamSessionStudents = async (
  sessionId: string,
  query: { status?: ExamSessionStudentStatus | ''; page?: number; size?: number } = {},
  signal?: AbortSignal,
): Promise<PageResponse<StudentSessionAssignmentResponse>> => {
  if (useMockExams) {
    const all = mockAssignments.filter((item) => item.sessionId === sessionId && (!query.status || item.status === query.status));
    const page = query.page ?? 0; const size = query.size ?? 50;
    return { content: all.slice(page * size, (page + 1) * size), page, size, totalElements: all.length, totalPages: Math.ceil(all.length / size) };
  }
  const response = await apiClient.get(`/exam-sessions/${encodeURIComponent(sessionId)}/students`, { params: query, signal });
  const data = unwrap<unknown>(response);
  if (isPage<StudentSessionAssignmentResponse>(data)) return data;
  const items = Array.isArray(data) ? data as StudentSessionAssignmentResponse[] : [];
  const filtered = query.status ? items.filter((item) => item.status === query.status) : items;
  const page = query.page ?? 0;
  const size = query.size ?? 50;
  return { content: filtered.slice(page * size, (page + 1) * size), page, size, totalElements: filtered.length, totalPages: Math.ceil(filtered.length / size) };
};

export const getExamAttemptSettings = async (examId: string): Promise<ExamAttemptSettings> => {
  const response = await apiClient.get(`/exam-sessions/${encodeURIComponent(examId)}/attempt-settings`);
  return unwrap<ExamAttemptSettings>(response);
};

export const updateExamAttemptSettings = async (examId: string, settings: ExamAttemptSettings): Promise<ExamAttemptSettings> => {
  const { affectedStudents: _affectedStudents, countOnStartEvent: _countOnStartEvent, ...payload } = settings;
  const response = await apiClient.put(`/exam-sessions/${encodeURIComponent(examId)}/attempt-settings`, payload);
  return unwrap<ExamAttemptSettings>(response);
};

export const getStudentAttempts = async (examId: string, studentId: string): Promise<{ attempts: ExamAttemptSummary[]; attemptsUsed: number; attemptsAllowed: number; attemptsRemaining: number; extraAttempts: number }> => {
  const response = await apiClient.get(`/exam-sessions/${encodeURIComponent(examId)}/students/${encodeURIComponent(studentId)}/attempts`);
  return unwrap(response);
};

export const getExamAttemptAudit = async (examId: string): Promise<ExamAttemptAuditRecord[]> => {
  const response = await apiClient.get(`/exam-sessions/${encodeURIComponent(examId)}/attempts/audit`);
  const data = unwrap<unknown>(response);
  return Array.isArray(data) ? data as ExamAttemptAuditRecord[] : [];
};

export const grantStudentAttempts = async (examId: string, studentId: string, additional: number, reason: string) => {
  const response = await apiClient.post(`/exam-sessions/${encodeURIComponent(examId)}/students/${encodeURIComponent(studentId)}/grant-attempts`, { additional, reason });
  return unwrap(response);
};

export const revokeStudentAttempts = async (examId: string, studentId: string, additional: number, reason: string) => {
  const response = await apiClient.post(`/exam-sessions/${encodeURIComponent(examId)}/students/${encodeURIComponent(studentId)}/revoke-attempts`, { additional, reason });
  return unwrap(response);
};

export const allocateStudentAttempt = async (examId: string, studentId: string, scheduledTime: string) => {
  const response = await apiClient.post(`/exam-sessions/${encodeURIComponent(examId)}/students/${encodeURIComponent(studentId)}/attempts`, { scheduledTime });
  return unwrap<ExamAttemptSummary>(response);
};

export const cancelExamAttempt = async (examAttemptId: string, reason: string) => {
  const response = await apiClient.post(`/exam-attempts/${encodeURIComponent(examAttemptId)}/cancel`, { reason });
  return unwrap<ExamAttemptSummary>(response);
};

export const voidExamAttempt = async (examAttemptId: string, reason: string) => {
  const response = await apiClient.post(`/exam-attempts/${encodeURIComponent(examAttemptId)}/void`, { reason });
  return unwrap<ExamAttemptSummary>(response);
};

export const selectOfficialAttempt = async (examId: string, studentId: string, attemptId: string) => {
  const response = await apiClient.put(`/exam-sessions/${encodeURIComponent(examId)}/students/${encodeURIComponent(studentId)}/official-attempt`, { attemptId, confirm: true });
  return unwrap(response);
};

export const getExamTopics = async (signal?: AbortSignal): Promise<ExamTopicOption[]> => {
  if (useMockExams) return mockTopics;
  const response = await apiClient.get('/topics', { signal });
  const data = unwrap<unknown>(response);
  if (!Array.isArray(data)) return [];
  return data.map((item) => {
    const topic = item as ExamTopicOption & { id?: string; code?: string; name?: string; subject?: { subjectName?: string; subjectId?: string } };
    return {
      topicId: topic.topicId ?? topic.id ?? '',
      topicCode: topic.topicCode ?? topic.code,
      topicName: topic.topicName ?? topic.name ?? '',
      subjectId: topic.subjectId ?? topic.subject?.subjectId,
      subjectName: topic.subjectName ?? topic.subject?.subjectName,
      description: topic.description,
    };
  });
};

export const addSessionStudents = async (sessionId: string, body: { studentIds?: string[]; studentCodes?: string[]; extraAttemptsByIdentifier?: Record<string, number> }): Promise<BulkStudentResult> => {
  if (useMockExams) {
    const identifiers = [...(body.studentIds ?? []), ...(body.studentCodes ?? [])];
    const added: StudentSessionAssignmentResponse[] = [];
    const skipped: BulkStudentResult['skipped'] = [];
    for (const identifier of identifiers) {
      if (mockAssignments.some((item) => item.sessionId === sessionId && (item.studentId === identifier || item.studentCode.toUpperCase() === identifier.toUpperCase()))) {
        skipped.push({ identifier, reason: 'Sinh viên đã có trong phiên.' }); continue;
      }
      const known = MOCK_ACTIVE_STUDENTS.find((item) => item.userId === identifier || item.studentOrStaffCode.toUpperCase() === identifier.toUpperCase());
      const code = known?.studentOrStaffCode ?? (body.studentCodes?.includes(identifier) ? identifier : `ST-${identifier.slice(-4).toUpperCase()}`);
      const assignment: StudentSessionAssignmentResponse = { assignmentId: `sample-assignment-${Date.now()}-${added.length}`, sessionId, sessionName: mockSessions.find((item) => item.sessionId === sessionId)?.sessionName ?? 'Phiên mẫu', studentId: known?.userId ?? identifier, studentCode: code, studentName: known?.fullName ?? `Sinh viên ${code}`, studentEmail: known?.email ?? `${code.toLowerCase()}@example.test`, scheduledTime: null, status: 'PENDING', attemptId: null, attemptStatus: null };
      mockAssignments.push(assignment); added.push(assignment);
    }
    updateMockStatistics(sessionId);
    return { added, skipped };
  }
  const response = await apiClient.post(`/exam-sessions/${encodeURIComponent(sessionId)}/students/bulk`, body);
  const data = unwrap<Partial<BulkStudentResult>>(response);
  return { added: data.added ?? [], skipped: data.skipped ?? [] };
};

export const importSessionStudents = async (sessionId: string, file: File): Promise<BulkStudentResult> => {
  if (useMockExams) {
    const text = await file.text();
    const codes = text.split(/\r?\n/).map((line) => line.split(',')[0]?.trim()).filter((value): value is string => Boolean(value) && !/^(student(code)?|mã sinh viên)$/i.test(value));
    const result = await addSessionStudents(sessionId, { studentCodes: codes });
    const lineByCode = new Map(codes.map((code, index) => [code, index + 1]));
    return { ...result, skipped: result.skipped.map((item) => ({ ...item, row: lineByCode.get(item.identifier) })) };
  }
  const body = new FormData();
  body.append('file', file);
  const response = await apiClient.post(`/exam-sessions/${encodeURIComponent(sessionId)}/students/import`, body);
  const data = unwrap<Partial<BulkStudentResult>>(response);
  return { added: data.added ?? [], skipped: data.skipped ?? [] };
};

export const removeSessionStudent = async (sessionId: string, studentId: string): Promise<void> => {
  if (useMockExams) { mockAssignments = mockAssignments.filter((item) => item.sessionId !== sessionId || item.studentId !== studentId); updateMockStatistics(sessionId); return; }
  await apiClient.delete(`/exam-sessions/${encodeURIComponent(sessionId)}/students/${encodeURIComponent(studentId)}`);
};

export const updateStudentSchedule = async (sessionId: string, studentId: string, scheduledTime: string, attemptNo = 1): Promise<StudentSessionAssignmentResponse> => {
  if (useMockExams) {
    const item = mockAssignments.find((assignment) => assignment.sessionId === sessionId && assignment.studentId === studentId);
    if (!item) throw new Error('Không tìm thấy sinh viên trong phiên.');
    item.scheduledTime = scheduledTime; item.status = 'SCHEDULED';
    return { ...item };
  }
  const response = await apiClient.put(`/exam-sessions/${encodeURIComponent(sessionId)}/students/${encodeURIComponent(studentId)}/schedule`, { scheduledTime, attemptNo });
  return unwrap<StudentSessionAssignmentResponse>(response);
};

export const autoScheduleStudents = async (sessionId: string, payload: AutoScheduleRequest): Promise<AutoScheduleResponse> => {
  if (useMockExams) {
    const rows = mockAssignments.filter((item) => item.sessionId === sessionId);
    const start = new Date(payload.startTime).getTime();
    const items = rows.map((student, index) => ({ studentId: student.studentId, studentName: student.studentName, studentCode: student.studentCode, slotOrder: index + 1, scheduledTime: new Date(start + index * payload.slotMinutes * 60_000).toISOString(), conflict: null }));
    if (!payload.dryRun) rows.forEach((student, index) => { student.slotOrder = index + 1; student.scheduledTime = items[index].scheduledTime; student.status = 'SCHEDULED'; });
    return { dryRun: payload.dryRun, items };
  }
  const response = await apiClient.post(`/exam-sessions/${encodeURIComponent(sessionId)}/schedule/auto`, payload);
  return unwrap<AutoScheduleResponse>(response);
};

export const getAttemptPlan = async (sessionId: string, attemptId: string, signal?: AbortSignal): Promise<StudentQuestionPlan> => {
  if (useMockExams) return { attemptId, totalQuestions: 3, questions: BLOOM_ORDER.slice(0, 3).map((bloomLevel, index) => ({ questionId: `sample-question-${index + 1}`, questionText: `Câu hỏi minh họa ${index + 1}`, bloomLevel, position: index + 1 })) };
  const response = await apiClient.get(`/exam-sessions/${encodeURIComponent(sessionId)}/attempts/${encodeURIComponent(attemptId)}/plan`, { signal });
  return unwrap<StudentQuestionPlan>(response);
};

export const getQuestionUsage = async (sessionId: string, signal?: AbortSignal): Promise<ExamQuestionUsage> => {
  if (useMockExams) {
    const students = mockAssignments.filter((item) => item.sessionId === sessionId).map((item) => ({ studentId: item.studentId, studentName: item.studentName, studentCode: item.studentCode, attemptId: item.attemptId ?? undefined }));
    return { sessionId, adjacentRepeatPairs: 0, usage: BLOOM_ORDER.slice(0, 3).map((level, index) => ({ questionId: `sample-question-${index + 1}`, questionText: `Câu hỏi minh họa ${index + 1}`, bloomLevel: level, usageCount: index === 0 ? 2 : 1, students: index === 0 ? students : students.slice(0, 1) })) };
  }
  const response = await apiClient.get(`/exam-sessions/${encodeURIComponent(sessionId)}/question-usage`, { signal });
  return unwrap<ExamQuestionUsage>(response);
};

export const getExamSessionError = (error: unknown, fallback = 'Không thể xử lý kỳ thi.') => {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { message?: string; data?: { code?: string }; errorCode?: string } | undefined;
    const code = body?.errorCode ?? body?.data?.code;
    const known: Record<string, string> = {
      ATTEMPTS_EXHAUSTED: 'Sinh viên đã sử dụng hết số lượt thi được cấp.',
      ATTEMPT_IN_PROGRESS: 'Sinh viên đang có lượt thi chưa kết thúc.',
      COOLDOWN_ACTIVE: 'Chưa hết thời gian chờ trước lượt thi tiếp theo.',
      OUTSIDE_WINDOW: 'Thời gian hiện tại ngoài khung giờ thi cho phép.',
      EXAM_CLOSED: 'Kỳ thi đã đóng.',
      POLICY_NOT_MANUAL: 'Chỉ có thể chọn lượt chính thức khi dùng chính sách giảng viên chọn.',
      CANNOT_VOID_RELEASED: 'Không thể vô hiệu hóa lượt đã công bố kết quả.',
      STALE_VERSION: 'Cấu hình đã thay đổi. Hãy tải lại trước khi lưu.',
      SCHEDULE_CONFLICT: 'Lịch thi bị trùng. Hãy chọn khung giờ khác.',
      NOT_ENROLLED: 'Sinh viên không có trong kỳ thi này.',
      ACCESS_DENIED: 'Không có quyền thực hiện thao tác này.',
      REASON_REQUIRED: 'Cần nhập lý do trước khi xác nhận.',
    };
    if (code && known[code]) return known[code];
    if (body?.message) return body.message;
    if (error.response?.status === 403) return 'Không có quyền thực hiện thao tác này.';
    if (error.response?.status === 404) return 'Không tìm thấy phiên thi hoặc dữ liệu yêu cầu.';
    if (error.response?.status === 409) return 'Dữ liệu đang xung đột với trạng thái hiện tại.';
    if (!error.response) return 'Không thể kết nối đến máy chủ. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : fallback;
};
