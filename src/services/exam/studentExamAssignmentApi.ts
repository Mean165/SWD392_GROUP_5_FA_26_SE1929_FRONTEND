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
  const result = new Error('Unable to load the exam schedule.') as StudentExamScheduleError;
  result.status = axios.isAxiosError(error) ? error.response?.status : undefined;
  result.retryable = !result.status || result.status >= 500;
  return result;
};

export const getStudentExamAssignments = async (
  filters: StudentExamFilters,
): Promise<PageResponse<StudentExamAssignment>> => {
  if (useMockExams) {
    const filtered = mockAssignments().filter((item) => (
      (!filters.status || filters.status === 'ALL' || item.assignmentStatus === filters.status)
      && item.scheduledTime.slice(0, 10) >= filters.from
      && item.scheduledTime.slice(0, 10) <= filters.to
    ));
    const start = filters.page * filters.size;
    return createMockPage(filtered.slice(start, start + filters.size), filters);
  }
  try {
    const params: Record<string, string | number> = { page: filters.page, size: filters.size };
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
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
    throw new Error('Unable to load exam history.');
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
