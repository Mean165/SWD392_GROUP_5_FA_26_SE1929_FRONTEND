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

export type ExamSessionStatus = 'DRAFT' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ExamSessionResponse {
  sessionId: string;
  createdById?: string;
  createdByName?: string;
  topicId: string;
  topicName: string;
  sessionName: string;
  maxMainQuestions: number;
  maxFollowupPerQuestion: number;
  timeLimitMinutes: number;
  status: ExamSessionStatus | string;
  startTime: string | null;
  createdAt: string;
  bufferMinutes?: number;
  avoidRepeatWindow?: number;
  maxOverlapPercent?: number;
  readiness?: ExamSessionReadiness;
  description?: string | null;
  bloomDistribution?: Record<string, number> | Array<{ bloomLevel: string; questionCount: number }> | null;
  statistics?: { studentCount: number; completedCount: number; absentCount: number };
  attemptCount?: number;
}

export interface CreateExamSessionRequest {
  topicId: string;
  sessionName: string;
  maxMainQuestions: number;
  maxFollowupPerQuestion: number;
  timeLimitMinutes: number;
  bufferMinutes?: number;
  avoidRepeatWindow?: number;
  maxOverlapPercent?: number;
  description?: string;
  bloomDistribution?: Record<string, number> | Array<{ bloomLevel: string; questionCount: number }>;
  status?: ExamSessionStatus;
  startTime?: string | null;
}

export interface UpdateExamSessionRequest {
  topicId: string;
  sessionName: string;
  maxMainQuestions: number;
  maxFollowupPerQuestion: number;
  timeLimitMinutes: number;
  bufferMinutes?: number;
  avoidRepeatWindow?: number;
  maxOverlapPercent?: number;
  description?: string;
  bloomDistribution?: Record<string, number> | Array<{ bloomLevel: string; questionCount: number }>;
  status?: ExamSessionStatus;
  startTime?: string | null;
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

export type AssignmentStatus = 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABSENT' | 'CANCELLED';
export type StudentAssignmentStatus = AssignmentStatus;

export interface StudentExamAssignment {
  assignmentId: string;
  scheduledTime: string | null;
  assignmentStatus: StudentAssignmentStatus;
  sessionId: string;
  sessionName: string;
  topicName?: string | null;
  sessionStatus: string;
  timeLimitMinutes: number;
  maxMainQuestions: number;
  maxFollowupPerQuestion: number;
  attemptId: string | null;
  attemptStatus: string | null;
  slotOrder?: number | null;
  totalMainQuestions?: number | null;
  attemptsUsed?: number;
  attemptsAllowed?: number;
  attemptsRemaining?: number;
  attempts?: ExamAttemptSummary[];
  officialResult?: OfficialResult | null;
}

export type ExamScorePolicy = 'LATEST' | 'HIGHEST' | 'FIRST' | 'AVERAGE' | 'LECTURER_CHOOSES';
export interface ExamAttemptSummary {
  examAttemptId: string;
  attemptNo: number;
  status: string;
  scheduledTime?: string | null;
  interviewSessionId?: string | null;
  aiSuggestedTotal?: number | null;
  finalTotal?: number | null;
  counted: boolean;
  voided: boolean;
}
export interface OfficialResult {
  policy: ExamScorePolicy;
  officialAttemptId: string | null;
  total: number | null;
  released: boolean;
}
export interface ExamAttemptSettings {
  maxAttempts: number;
  scorePolicy: ExamScorePolicy;
  avoidRepeatQuestions: boolean;
  cooldownMinutes: number;
  attemptWindowStart: string | null;
  attemptWindowEnd: string | null;
  countOnStartEvent: 'FIRST_QUESTION_ASKED';
  allowLecturerExtraAttempts: boolean;
  countAbandoned: boolean;
  countExpired: boolean;
  affectedStudents: Array<{ studentId: string; studentName?: string; attemptsUsed: number; attemptsAllowed?: number }>;
  version: number;
}
export interface ExamAttemptAuditRecord {
  auditId?: string;
  examAttemptId: string;
  studentId?: string;
  attemptNo?: number;
  action: string;
  reason?: string | null;
  actorName?: string | null;
  createdAt: string;
}

export type ExamSessionStudentStatus = 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABSENT' | 'CANCELLED';

export interface StudentSessionAssignmentResponse {
  assignmentId: string;
  sessionId: string;
  sessionName: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  studentEmail: string;
  scheduledTime: string | null;
  status: ExamSessionStudentStatus | string;
  slotOrder?: number | null;
  attemptId?: string | null;
  attemptStatus?: string | null;
  aiScore?: number | null;
  finalScore?: number | null;
  totalScore?: number | null;
  attemptsUsed?: number;
  attemptsAllowed?: number;
  attemptsRemaining?: number;
  extraAttempts?: number;
  currentAttempt?: ExamAttemptSummary | null;
  attempts?: ExamAttemptSummary[];
  officialResult?: OfficialResult | null;
}

export type ReadinessIssueCode = 'SUBJECT_RUBRIC_MISSING' | 'SUBJECT_RUBRIC_INVALID' | 'INSUFFICIENT_QUESTIONS' | 'OVERLAP_EXCEEDS_LIMIT' | 'SCHEDULE_OVERLAP';
export interface ReadinessIssue {
  code: ReadinessIssueCode;
  bloomLevel: import('./rubric').BloomLevel | null;
  have: number | null;
  need: number | null;
  maxPercent: number | null;
  minimumAdditionalQuestions: number | null;
  minimumIsUpperBound: boolean | null;
  additionalQuestionsByBloom: Partial<Record<import('./rubric').BloomLevel, number>> | null;
}

export interface ExamSessionReadiness {
  ready: boolean;
  canStart: boolean;
  studentCount: number;
  unscheduledCount: number;
  overlappingCount: number;
  approvedQuestionsByBloom: Record<string, number>;
  missingQuestionsByBloom: Record<string, number>;
  warnings: string[];
  blockingErrors: string[];
  issues: ReadinessIssue[];
}

export interface ExamSessionStudentSummary {
  studentCount: number;
  completedCount: number;
  absentCount: number;
}

export interface BulkStudentResult {
  added: StudentSessionAssignmentResponse[];
  skipped: Array<{ identifier: string; row?: number; reason: string }>;
}

export interface AutoScheduleRequest {
  startTime: string;
  shuffle: boolean;
  seed?: number | null;
  slotMinutes: number;
  dryRun: boolean;
  attemptNo?: number;
}

export interface AutoScheduleItem {
  studentId: string;
  studentName?: string;
  studentCode?: string;
  slotOrder: number;
  scheduledTime: string;
  conflict?: string | null;
}

export interface AutoScheduleResponse {
  dryRun: boolean;
  items: AutoScheduleItem[];
}

export interface StudentQuestionPlan {
  attemptId: string;
  totalQuestions: number;
  questions: Array<{
    questionId: string;
    questionText: string;
    bloomLevel: string;
    position?: number;
    order?: number;
  }>;
}

export interface ExamQuestionUsage {
  sessionId: string;
  usage: Array<{
    questionId: string;
    questionText?: string;
    bloomLevel?: string;
    usageCount: number;
    students?: Array<{ studentId: string; studentName: string; studentCode?: string; attemptId?: string }>;
  }>;
  adjacentRepeatPairs: number;
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
  reasonCode?: string | null;
  attemptsUsed?: number;
  attemptsAllowed?: number;
  attemptsRemaining?: number;
  nextAttemptId?: string | null;
  nextAttemptNo?: number | null;
  retryAt?: string | null;
}

export interface StudentExamFilters {
  from: string;
  to: string;
  status?: string;
  page: number;
  size: number;
}
