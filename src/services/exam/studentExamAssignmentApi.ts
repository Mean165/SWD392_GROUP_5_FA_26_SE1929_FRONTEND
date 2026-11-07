import axios from 'axios';
import apiClient from '../api/apiClient';
import { unwrapApiResponse } from '../api/apiResponse';
import type {
  ExamEntryEligibility,
  PageResponse,
  StudentExamAssignment,
  StudentExamFilters,
} from '../../types/exam';

const useMockExams = import.meta.env.VITE_USE_MOCK_EXAMS === 'true';

const mockAssignments = (): StudentExamAssignment[] => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const assignment: StudentExamAssignment = {
    assignmentId: 'sample-assignment-1',
    scheduledTime: tomorrow.toISOString(),
    assignmentStatus: 'SCHEDULED',
    sessionId: 'sample-session-1',
    sessionName: 'Buổi thi mẫu',
    topicName: 'Phát triển phần mềm',
    sessionStatus: 'SCHEDULED',
    timeLimitMinutes: 15,
    maxMainQuestions: 3,
    maxFollowupPerQuestion: 2,
    attemptId: null,
    attemptStatus: null,
    slotOrder: 1,
    totalMainQuestions: 3,
  };
  return [
    { ...assignment, assignmentId: 'sample-assignment-1' },
    { ...assignment, assignmentId: 'sample-assignment-2', assignmentStatus: 'PENDING', scheduledTime: tomorrow.toISOString(), slotOrder: null },
    { ...assignment, assignmentId: 'sample-assignment-3', assignmentStatus: 'ABSENT', scheduledTime: tomorrow.toISOString(), slotOrder: 2 },
    { ...assignment, assignmentId: 'sample-assignment-4', assignmentStatus: 'CANCELLED', scheduledTime: tomorrow.toISOString(), slotOrder: 3 },
  ];
};

const createMockPage = <T>(content: T[], filters: Pick<StudentExamFilters, 'page' | 'size'>): PageResponse<T> => ({
  content,
  page: filters.page,
  size: filters.size,
  totalElements: content.length,
  totalPages: content.length ? Math.ceil(content.length / filters.size) : 0,
});

export interface StudentExamScheduleError extends Error { status?: number; retryable: boolean }

const toScheduleError = (error: unknown): StudentExamScheduleError => {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  const body = axios.isAxiosError(error) ? error.response?.data as { message?: string } | undefined : undefined;
  const message = body?.message
    || (status === 400 ? 'Bộ lọc ngày hoặc trạng thái không hợp lệ.'
      : status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
        : status === 403 ? 'Tài khoản hiện tại không có quyền xem lịch thi.'
          : status === 404 ? 'Không tìm thấy API lịch thi.'
            : status && status >= 500 ? `Máy chủ không tải được lịch thi (HTTP ${status}).`
              : status ? `Không thể tải lịch thi (HTTP ${status}).`
                : 'Không thể kết nối đến máy chủ. Hãy kiểm tra kết nối rồi thử lại.');
  const result = new Error(message) as StudentExamScheduleError;
  result.status = status;
  result.retryable = !status || status >= 500;
  return result;
};

export const getStudentExamAssignments = async (
  filters: StudentExamFilters,
): Promise<PageResponse<StudentExamAssignment>> => {
  if (useMockExams) {
    const filtered = mockAssignments().filter((item) => (
      (!filters.status || filters.status === 'ALL' || item.assignmentStatus === filters.status)
      && Boolean(item.scheduledTime)
      && item.scheduledTime!.slice(0, 10) >= filters.from
      && item.scheduledTime!.slice(0, 10) <= filters.to
    ));
    const start = filters.page * filters.size;
    return createMockPage(filtered.slice(start, start + filters.size), filters);
  }
  try {
    const params: Record<string, string | number> = { page: filters.page, size: filters.size };
    if (filters.from) params.from = /^\d{4}-\d{2}-\d{2}$/.test(filters.from) ? `${filters.from}T00:00:00+07:00` : filters.from;
    if (filters.to) params.to = /^\d{4}-\d{2}-\d{2}$/.test(filters.to) ? `${filters.to}T23:59:59+07:00` : filters.to;
    if (filters.status && filters.status !== 'ALL') params.status = filters.status;
    const response = await apiClient.get('/student/exam-assignments', { params });
    return unwrapApiResponse<PageResponse<StudentExamAssignment>>(response.data);
  } catch (error) {
    throw toScheduleError(error);
  }
};

export const getStudentExamAssignmentById = async (assignmentId: string): Promise<StudentExamAssignment> => {
  if (useMockExams) {
    const assignment = mockAssignments().find((item) => item.assignmentId === assignmentId);
    if (assignment) return assignment;
    throw new Error('Không tìm thấy lịch thi.');
  }
  try {
    const response = await apiClient.get(`/student/exam-assignments/${encodeURIComponent(assignmentId)}`);
    return unwrapApiResponse<StudentExamAssignment>(response.data);
  } catch (error) {
    throw new Error('Unable to load exam assignment.');
  }
};

export const getStudentExamHistory = async (
  page: number,
  size: number,
): Promise<PageResponse<StudentExamAssignment>> => {
  if (useMockExams) return createMockPage([], { page, size });
  try {
    const response = await apiClient.get('/student/exam-assignments/history', { params: { page, size } });
    return unwrapApiResponse<PageResponse<StudentExamAssignment>>(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const body = error.response?.data as { message?: string } | undefined;
      if (status === 401) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      if (status === 403) throw new Error('Tài khoản hiện tại không có quyền xem lịch sử thi.');
      if (!error.response) throw new Error('Không thể kết nối đến máy chủ. Hãy kiểm tra kết nối rồi thử lại.');
      if (body?.message) throw new Error(body.message);
      if (status && status >= 500) throw new Error(`Máy chủ đang gặp lỗi (HTTP ${status}). Vui lòng thử lại.`);
      if (status) throw new Error(`Không thể tải lịch sử thi (HTTP ${status}).`);
    }
    throw error instanceof Error ? error : new Error('Không thể tải lịch sử thi.');
  }
};

export const getStudentExamEligibility = async (assignmentId: string, examAttemptId?: string | null): Promise<ExamEntryEligibility> => {
  if (useMockExams) {
    const assignment = mockAssignments().find((item) => item.assignmentId === assignmentId);
    if (!assignment || assignment.assignmentStatus !== 'SCHEDULED') {
      return { canEnter: false, reason: assignment?.assignmentStatus === 'PENDING' ? 'Chưa được xếp lịch.' : 'Lịch thi chưa sẵn sàng.', opensAt: assignment?.scheduledTime ?? null, closesAt: null };
    }
    return { canEnter: true, reason: null, opensAt: null, closesAt: null };
  }
  try {
    const response = await apiClient.get(`/student/exam-assignments/${encodeURIComponent(assignmentId)}/eligibility`, { params: examAttemptId ? { examAttemptId } : undefined });
    return unwrapApiResponse<ExamEntryEligibility>(response.data);
  } catch (error) {
    throw new Error('Unable to load exam eligibility.');
  }
};

export { useMockExams };
