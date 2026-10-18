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

export interface ExamSession {
  id?: number;
  examId: number;
  sessionCode?: string;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  status?: string;
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

export type StudentAssignmentStatus = 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';

export interface StudentExamAssignment {
  assignmentId: string;
  scheduledTime: string;
  assignmentStatus: StudentAssignmentStatus;
  sessionId: string;
  sessionName: string;
  sessionStatus: string;
  timeLimitMinutes: number;
  maxMainQuestions: number;
  maxFollowupPerQuestion: number;
  attemptId: string | null;
  attemptStatus: string | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ExamEntryEligibility {
  canEnter: boolean;
  reason: string | null;
  opensAt: string | null;
  closesAt: string | null;
}

export interface StudentExamFilters {
  from: string;
  to: string;
  status?: string;
  page: number;
  size: number;
}
