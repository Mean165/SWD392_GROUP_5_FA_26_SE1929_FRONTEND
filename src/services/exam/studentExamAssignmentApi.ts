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
  return [{
    assignmentId: 'sample-assignment-1',
    scheduledTime: tomorrow.toISOString(),
    assignmentStatus: 'SCHEDULED',
    sessionId: 'sample-session-1',
    sessionName: 'Buổi thi mẫu',
    sessionStatus: 'SCHEDULED',
    timeLimitMinutes: 15,
    maxMainQuestions: 3,
    maxFollowupPerQuestion: 2,
    attemptId: null,
    attemptStatus: null,
  }];
};

const createMockPage = <T>(content: T[], filters: Pick<StudentExamFilters, 'page' | 'size'>): PageResponse<T> => ({
  content,
  page: filters.page,
  size: filters.size,
  totalElements: content.length,
  totalPages: content.length ? Math.ceil(content.length / filters.size) : 0,
});

const toErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    return 'Tài khoản hiện tại không có quyền xem lịch thi sinh viên.';
  }
  if (axios.isAxiosError(error) && !error.response) {
    return 'Không thể kết nối đến máy chủ. Lịch thi chưa được tải; hãy kiểm tra kết nối rồi thử lại.';
  }
  return 'Không thể tải dữ liệu lịch thi. Vui lòng thử lại sau.';
};

export const getStudentExamAssignments = async (
  filters: StudentExamFilters,
): Promise<PageResponse<StudentExamAssignment>> => {
  if (useMockExams) {
    const filtered = mockAssignments().filter((item) => (
      (!filters.status || item.assignmentStatus === filters.status)
      && item.scheduledTime.slice(0, 10) >= filters.from
      && item.scheduledTime.slice(0, 10) <= filters.to
    ));
    const start = filters.page * filters.size;
    return createMockPage(filtered.slice(start, start + filters.size), filters);
  }
  try {
    const response = await apiClient.get('/student/exam-assignments', { params: filters });
    return unwrapApiResponse<PageResponse<StudentExamAssignment>>(response.data);
  } catch (error) {
    throw new Error(toErrorMessage(error));
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
    throw new Error(toErrorMessage(error));
  }
};

export const getStudentExamEligibility = async (assignmentId: string): Promise<ExamEntryEligibility> => {
  if (useMockExams) {
    return { canEnter: true, reason: null, opensAt: null, closesAt: null };
  }
  try {
    const response = await apiClient.get(`/student/exam-assignments/${encodeURIComponent(assignmentId)}/eligibility`);
    return unwrapApiResponse<ExamEntryEligibility>(response.data);
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
};

export { useMockExams };
