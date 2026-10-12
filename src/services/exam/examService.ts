import apiClient from '../api/apiClient';
import type {
  ExamSessionResponse,
  CreateExamSessionRequest,
  UpdateExamSessionRequest,
  AssignStudentSessionRequest,
  StudentSessionAssignmentResponse,
  Exam,
  ExamParticipant,
  ExamSchedule,
} from '../../types/exam';
import type { ApiResponse } from '../../types/user';

/**
 * Service quản lý Kỳ thi & Phiên thi vấn đáp (Nhóm chức năng số 2)
 * Kết nối trực tiếp với backend ExamSessionController: /api/exam-sessions
 */

export const getAllExamSessions = async (): Promise<ExamSessionResponse[]> => {
  const response = await apiClient.get<ApiResponse<ExamSessionResponse[]>>('/exam-sessions');
  return response.data?.data ?? (response.data as unknown as ExamSessionResponse[]) ?? [];
};

export const getExamSessionById = async (id: string): Promise<ExamSessionResponse> => {
  const response = await apiClient.get<ApiResponse<ExamSessionResponse>>(`/exam-sessions/${id}`);
  return response.data?.data ?? (response.data as unknown as ExamSessionResponse);
};

export const createExamSession = async (data: CreateExamSessionRequest): Promise<ExamSessionResponse> => {
  const response = await apiClient.post<ApiResponse<ExamSessionResponse>>('/exam-sessions', data);
  return response.data?.data ?? (response.data as unknown as ExamSessionResponse);
};

export const updateExamSession = async (
  id: string,
  data: UpdateExamSessionRequest,
): Promise<ExamSessionResponse> => {
  const response = await apiClient.put<ApiResponse<ExamSessionResponse>>(`/exam-sessions/${id}`, data);
  return response.data?.data ?? (response.data as unknown as ExamSessionResponse);
};

export const assignStudentToSession = async (
  sessionId: string,
  data: AssignStudentSessionRequest,
): Promise<StudentSessionAssignmentResponse> => {
  const response = await apiClient.post<ApiResponse<StudentSessionAssignmentResponse>>(
    `/exam-sessions/${sessionId}/assign-student`,
    {
      ...data,
      sessionId,
    },
  );
  return response.data?.data ?? (response.data as unknown as StudentSessionAssignmentResponse);
};

export const getStudentsBySessionId = async (
  sessionId: string,
): Promise<StudentSessionAssignmentResponse[]> => {
  const response = await apiClient.get<ApiResponse<StudentSessionAssignmentResponse[]>>(
    `/exam-sessions/${sessionId}/students`,
  );
  return response.data?.data ?? (response.data as unknown as StudentSessionAssignmentResponse[]) ?? [];
};

export const getExams = async (): Promise<Exam[]> => {
  const sessions = await getAllExamSessions();
  return sessions.map((s) => ({
    id: Number(s.sessionId) || 1,
    name: s.sessionName,
    durationMinutes: s.timeLimitMinutes,
    status: s.status,
    createdAt: s.createdAt,
  }));
};

export const getExamById = async (id: number): Promise<Exam | null> => {
  const session = await getExamSessionById(String(id));
  if (!session) return null;
  return {
    id: Number(session.sessionId) || id,
    name: session.sessionName,
    durationMinutes: session.timeLimitMinutes,
    status: session.status,
    createdAt: session.createdAt,
  };
};

export const createExam = async (payload: Partial<Exam>): Promise<Exam> => {
  const res = await createExamSession({
    sessionName: payload.name || 'Oral Exam Session',
    maxMainQuestions: 3,
    maxFollowupPerQuestion: 2,
    timeLimitMinutes: payload.durationMinutes || 15,
    startTime: new Date().toISOString(),
  });
  return {
    id: Number(res.sessionId) || 1,
    name: res.sessionName,
    durationMinutes: res.timeLimitMinutes,
    status: res.status,
  };
};

export const updateExam = async (id: number, payload: Partial<Exam>): Promise<Exam> => {
  const res = await updateExamSession(String(id), {
    sessionName: payload.name,
    timeLimitMinutes: payload.durationMinutes,
    status: payload.status,
  });
  return {
    id: Number(res.sessionId) || id,
    name: res.sessionName,
    durationMinutes: res.timeLimitMinutes,
    status: res.status,
  };
};

export const deleteExam = async (_id: number): Promise<void> => {
  return Promise.resolve();
};

export const getExamParticipants = async (examId: number): Promise<ExamParticipant[]> => {
  const students = await getStudentsBySessionId(String(examId));
  return students.map((st) => ({
    id: 1,
    examId,
    studentId: Number(st.studentId) || 1,
    status: st.status,
  }));
};

export const getExamSchedule = async (examId: number): Promise<ExamSchedule[]> => {
  const students = await getStudentsBySessionId(String(examId));
  return students.map((st) => ({
    id: 1,
    examId,
    startTime: st.scheduledTime,
    endTime: st.scheduledTime,
  }));
};

export const createExamSchedule = async (
  examId: number,
  payload: Partial<ExamSchedule>,
): Promise<ExamSchedule> => {
  return Promise.resolve({
    id: 1,
    examId,
    startTime: payload.startTime || new Date().toISOString(),
    endTime: payload.endTime || new Date().toISOString(),
  });
};

export const updateExamSchedule = async (
  examId: number,
  scheduleId: number,
  payload: Partial<ExamSchedule>,
): Promise<ExamSchedule> => {
  return Promise.resolve({
    id: scheduleId,
    examId,
    startTime: payload.startTime || new Date().toISOString(),
    endTime: payload.endTime || new Date().toISOString(),
  });
};

export * from './examSessionService';
