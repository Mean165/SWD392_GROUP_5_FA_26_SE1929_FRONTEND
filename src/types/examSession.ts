export type ExamSessionStatus = 'DRAFT' | 'READY' | 'IN_PROGRESS' | 'COMPLETED';

export type ParticipantStatus = 'NOT_STARTED' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABSENT';

export interface ExamSession {
  id: string | number;
  sessionName: string;
  maxMainQuestions: number;
  maxFollowupPerQuestion: number;
  timeLimitMinutes: number;
  startTime: string;
  status: ExamSessionStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentSessionAssignment {
  id?: string | number;
  sessionId?: string | number;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  studentCode?: string;
  scheduledTime: string;
  participantStatus: ParticipantStatus | string;
  assignedAt?: string;
}

export interface CreateExamSessionRequest {
  sessionName: string;
  maxMainQuestions: number;
  maxFollowupPerQuestion: number;
  timeLimitMinutes: number;
  startTime: string;
  status?: ExamSessionStatus;
}

export interface UpdateExamSessionStatusRequest {
  status: ExamSessionStatus;
}

export interface AssignStudentRequest {
  studentId: string;
  scheduledTime: string;
  participantStatus?: ParticipantStatus | string;
}

export interface AssignStudentsPayload {
  studentIds?: string[];
  assignments?: AssignStudentRequest[];
  studentId?: string;
  scheduledTime?: string;
}

export interface ExamSessionFilterParams {
  status?: ExamSessionStatus | string;
  keyword?: string;
}
