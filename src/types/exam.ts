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
