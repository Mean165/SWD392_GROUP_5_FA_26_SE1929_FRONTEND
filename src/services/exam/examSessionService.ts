import apiClient from '../api/apiClient';
import type {
  ExamSession,
  StudentSessionAssignment,
  CreateExamSessionRequest,
  ExamSessionFilterParams,
  ExamSessionStatus,
  AssignStudentRequest,
  AssignStudentsPayload,
} from '../../types/examSession';
import type { ApiResponse } from '../../types/user';

const SESSIONS_STORAGE_KEY = 'aives_mock_exam_sessions';
const ASSIGNMENTS_STORAGE_KEY = 'aives_mock_session_assignments';

const INITIAL_MOCK_SESSIONS: ExamSession[] = [
  {
    id: 'ses-101',
    sessionName: 'Midterm Oral Examination - Architecture & Systems',
    timeLimitMinutes: 45,
    maxMainQuestions: 3,
    maxFollowupPerQuestion: 2,
    startTime: '2026-10-15T08:30:00',
    status: 'READY',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'ses-102',
    sessionName: 'Final Project Technical Defense - Batch A',
    timeLimitMinutes: 60,
    maxMainQuestions: 4,
    maxFollowupPerQuestion: 3,
    startTime: '2026-10-22T13:30:00',
    status: 'DRAFT',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'ses-103',
    sessionName: 'Cloud & Database Optimization Evaluation',
    timeLimitMinutes: 30,
    maxMainQuestions: 2,
    maxFollowupPerQuestion: 2,
    startTime: '2026-10-12T09:00:00',
    status: 'IN_PROGRESS',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'ses-104',
    sessionName: 'Sprint 1 Algorithm Competency Verification',
    timeLimitMinutes: 40,
    maxMainQuestions: 3,
    maxFollowupPerQuestion: 2,
    startTime: '2026-10-05T14:00:00',
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
];

const INITIAL_MOCK_ASSIGNMENTS: Record<string, StudentSessionAssignment[]> = {
  'ses-101': [
    {
      id: 'asg-1',
      sessionId: 'ses-101',
      studentId: 'usr-st-01',
      studentName: 'Nguyen Van An',
      studentEmail: 'annvse1701@fpt.edu.vn',
      studentCode: 'SE170101',
      scheduledTime: '2026-10-15T08:30:00',
      participantStatus: 'NOT_STARTED',
      assignedAt: new Date().toISOString(),
    },
    {
      id: 'asg-2',
      sessionId: 'ses-101',
      studentId: 'usr-st-02',
      studentName: 'Le Thi Bao',
      studentEmail: 'baoltse1702@fpt.edu.vn',
      studentCode: 'SE170202',
      scheduledTime: '2026-10-15T09:15:00',
      participantStatus: 'WAITING',
      assignedAt: new Date().toISOString(),
    },
  ],
  'ses-103': [
    {
      id: 'asg-3',
      sessionId: 'ses-103',
      studentId: 'usr-st-03',
      studentName: 'Pham Quoc Cuong',
      studentEmail: 'cuongpqse1703@fpt.edu.vn',
      studentCode: 'SE170303',
      scheduledTime: '2026-10-12T09:00:00',
      participantStatus: 'IN_PROGRESS',
      assignedAt: new Date().toISOString(),
    },
  ],
};

function getStoredSessions(): ExamSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return INITIAL_MOCK_SESSIONS;
}

function saveStoredSessions(sessions: ExamSession[]): void {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // ignore
  }
}

function getStoredAssignments(): Record<string, StudentSessionAssignment[]> {
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return INITIAL_MOCK_ASSIGNMENTS;
}

function saveStoredAssignments(map: Record<string, StudentSessionAssignment[]>): void {
  try {
    localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/**
 * GET /exam-sessions
 * Lấy danh sách các ca thi / kỳ đánh giá (ExamSession)
 */
export const getExamSessions = async (
  params?: ExamSessionFilterParams,
): Promise<ExamSession[]> => {
  try {
    const response = await apiClient.get<ApiResponse<ExamSession[]> | ExamSession[]>(
      '/exam-sessions',
      { params },
    );
    const data =
      (response.data as ApiResponse<ExamSession[]>)?.data ?? (response.data as ExamSession[]);
    if (Array.isArray(data) && data.length > 0) {
      saveStoredSessions(data);
      return data;
    }
    return getStoredSessions();
  } catch {
    let list = getStoredSessions();
    if (params) {
      if (params.status && params.status !== 'ALL') {
        list = list.filter((s) => s.status === params.status);
      }
      if (params.keyword && params.keyword.trim()) {
        const kw = params.keyword.toLowerCase().trim();
        list = list.filter((s) => s.sessionName.toLowerCase().includes(kw));
      }
    }
    return list;
  }
};

/**
 * GET /exam-sessions/{id}
 * Lấy thông tin chi tiết một ExamSession
 */
export const getExamSessionById = async (id: string | number): Promise<ExamSession | null> => {
  try {
    const response = await apiClient.get<ApiResponse<ExamSession> | ExamSession>(
      `/exam-sessions/${id}`,
    );
    return (response.data as ApiResponse<ExamSession>)?.data ?? (response.data as ExamSession);
  } catch {
    const list = getStoredSessions();
    return list.find((s) => String(s.id) === String(id)) || null;
  }
};

/**
 * POST /exam-sessions
 * Tạo mới ExamSession
 * Lưu ý: KHÔNG có courseId theo đặc tả yêu cầu
 */
export const createExamSession = async (
  payload: CreateExamSessionRequest,
): Promise<ExamSession> => {
  const newSession: ExamSession = {
    id: `ses-${Date.now()}`,
    sessionName: payload.sessionName,
    timeLimitMinutes: Number(payload.timeLimitMinutes) || 45,
    maxMainQuestions: Number(payload.maxMainQuestions) || 3,
    maxFollowupPerQuestion: Number(payload.maxFollowupPerQuestion) || 2,
    startTime: payload.startTime,
    status: payload.status || 'DRAFT',
    createdAt: new Date().toISOString(),
  };

  try {
    const response = await apiClient.post<ApiResponse<ExamSession> | ExamSession>(
      '/exam-sessions',
      payload,
    );
    const data =
      (response.data as ApiResponse<ExamSession>)?.data ?? (response.data as ExamSession);

    const list = getStoredSessions();
    saveStoredSessions([data || newSession, ...list]);
    return data || newSession;
  } catch {
    const list = getStoredSessions();
    saveStoredSessions([newSession, ...list]);
    return newSession;
  }
};

/**
 * PATCH /exam-sessions/{id}/status
 * Cập nhật trạng thái ca thi (DRAFT, READY, IN_PROGRESS, COMPLETED)
 */
export const updateExamSessionStatus = async (
  id: string | number,
  status: ExamSessionStatus,
): Promise<ExamSession> => {
  try {
    const response = await apiClient.patch<ApiResponse<ExamSession> | ExamSession>(
      `/exam-sessions/${id}/status`,
      { status },
    );
    const data =
      (response.data as ApiResponse<ExamSession>)?.data ?? (response.data as ExamSession);

    const list = getStoredSessions();
    const updated = list.map((s) => {
      if (String(s.id) === String(id)) {
        return data ? { ...s, ...data } : { ...s, status };
      }
      return s;
    });
    saveStoredSessions(updated);
    return data || updated.find((s) => String(s.id) === String(id))!;
  } catch {
    const list = getStoredSessions();
    let updatedItem: ExamSession | null = null;
    const updated = list.map((s) => {
      if (String(s.id) === String(id)) {
        updatedItem = { ...s, status, updatedAt: new Date().toISOString() };
        return updatedItem;
      }
      return s;
    });
    saveStoredSessions(updated);
    if (!updatedItem) {
      throw new Error(`ExamSession with id ${id} not found.`);
    }
    return updatedItem;
  }
};

/**
 * GET /exam-sessions/{sessionId}/students
 * Lấy danh sách sinh viên đã được phân công vào ca thi
 */
export const getExamSessionStudents = async (
  sessionId: string | number,
): Promise<StudentSessionAssignment[]> => {
  try {
    const response = await apiClient.get<
      ApiResponse<StudentSessionAssignment[]> | StudentSessionAssignment[]
    >(`/exam-sessions/${sessionId}/students`);
    const data =
      (response.data as ApiResponse<StudentSessionAssignment[]>)?.data ??
      (response.data as StudentSessionAssignment[]);
    if (Array.isArray(data)) {
      const all = getStoredAssignments();
      all[String(sessionId)] = data;
      saveStoredAssignments(all);
      return data;
    }
    const all = getStoredAssignments();
    return all[String(sessionId)] || [];
  } catch {
    const all = getStoredAssignments();
    return all[String(sessionId)] || [];
  }
};

/**
 * POST /exam-sessions/{sessionId}/assign-students
 * Phân công sinh viên vào ca thi kèm thời gian thi (scheduledTime)
 * Ngăn chặn phân công trùng lặp
 */
export const assignStudentsToSession = async (
  sessionId: string | number,
  payload: AssignStudentRequest | AssignStudentsPayload,
): Promise<StudentSessionAssignment> => {
  try {
    const response = await apiClient.post<
      ApiResponse<StudentSessionAssignment> | StudentSessionAssignment
    >(`/exam-sessions/${sessionId}/assign-students`, payload);
    const data =
      (response.data as ApiResponse<StudentSessionAssignment>)?.data ??
      (response.data as StudentSessionAssignment);

    // Cập nhật bộ nhớ đệm
    const all = getStoredAssignments();
    const existing = all[String(sessionId)] || [];
    if (data) {
      all[String(sessionId)] = [...existing, data];
      saveStoredAssignments(all);
      return data;
    }
  } catch {
    // Tiếp tục thực thi fallback
  }

  // Fallback xử lý khi backend offline
  const all = getStoredAssignments();
  const existing = all[String(sessionId)] || [];

  const studentId =
    ('studentId' in payload && payload.studentId) ||
    ('assignments' in payload && payload.assignments?.[0]?.studentId) ||
    'stu-unknown';

  const scheduledTime =
    ('scheduledTime' in payload && payload.scheduledTime) ||
    ('assignments' in payload && payload.assignments?.[0]?.scheduledTime) ||
    new Date().toISOString();

  // Kiểm tra duplicate
  const isDuplicate = existing.some((a) => String(a.studentId) === String(studentId));
  if (isDuplicate) {
    throw new Error('Sinh viên này đã được phân công vào ca thi này rồi (Duplicate assignment).');
  }

  const newAssignment: StudentSessionAssignment = {
    id: `asg-${Date.now()}`,
    sessionId,
    studentId,
    scheduledTime,
    participantStatus: 'NOT_STARTED',
    assignedAt: new Date().toISOString(),
  };

  all[String(sessionId)] = [...existing, newAssignment];
  saveStoredAssignments(all);

  return newAssignment;
};

export default {
  getExamSessions,
  getExamSessionById,
  createExamSession,
  updateExamSessionStatus,
  getExamSessionStudents,
  assignStudentsToSession,
};
