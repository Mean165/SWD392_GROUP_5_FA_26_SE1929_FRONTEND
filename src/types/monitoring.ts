export interface ExamRecording {
  id?: number;
  examId?: number;
  studentId?: number;
  recordingUrl?: string;
  durationSeconds?: number;
  createdAt?: string;
}

export interface ExamEvent {
  id?: number;
  examId?: number;
  eventType: string;
  description?: string;
  createdAt?: string;
}

export interface InterviewEvent {
  id?: number;
  interviewId?: number;
  eventType: string;
  description?: string;
  createdAt?: string;
}

export interface AuditLog {
  id?: number;
  actorId?: number;
  actorName?: string;
  action: string;
  module?: string;
  createdAt?: string;
}
