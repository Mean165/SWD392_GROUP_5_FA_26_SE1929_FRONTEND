export * from './examSession';

export interface ExamSessionResponse {
  sessionId: string;
  createdById?: string;
  createdByName?: string;
  sessionName: string;
  maxMainQuestions: number;
  maxFollowupPerQuestion: number;
  timeLimitMinutes: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | string;
  startTime?: string;
  createdAt?: string;
  topicId?: string;
  subjectCode?: string;
}

export interface UpdateExamSessionRequest {
  sessionName?: string;
  maxMainQuestions?: number;
  maxFollowupPerQuestion?: number;
  timeLimitMinutes?: number;
  status?: string;
  startTime?: string;
}

export interface AssignStudentSessionRequest {
  sessionId?: string;
  studentCode: string;
  scheduledTime?: string;
  status?: string;
}

export interface StudentSessionAssignmentResponse {
  assignmentId: string;
  sessionId: string;
  sessionName?: string;
  studentId: string;
  studentCode: string;
  studentName?: string;
  studentEmail?: string;
  scheduledTime: string;
  status: 'SCHEDULED' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABSENT' | string;
}

export interface ExamSessionFilterValues {
  keyword?: string;
  status?: string;
  startDate?: string;
}

export interface Exam {
  id?: number;
  name: string;
  subjectId?: number;
  description?: string;
  durationMinutes?: number;
  status?: string;
  createdBy?: number;
  createdAt?: string;
}

export interface ExamParticipant {
  id?: number;
  examId: number;
  studentId: number;
  status?: string;
  totalScore?: number;
}

export interface ExamSchedule {
  id?: number;
  examId: number;
  startTime: string;
  endTime: string;
  room?: string;
  mode?: string;
}

