import type { AuditLog, ExamEvent, ExamRecording, InterviewEvent } from '../../types/monitoring';
import { backendUnavailable } from '../api/backendUnavailable';

export const getExamRecording = async (examId: number): Promise<ExamRecording | null> => {
  void examId;
  return backendUnavailable('Exam recording');
};

export const getExamEvents = async (examId: number): Promise<ExamEvent[]> => {
  void examId;
  return backendUnavailable('Exam monitoring events');
};

export const getInterviewEvents = async (interviewId: number): Promise<InterviewEvent[]> => {
  void interviewId;
  return backendUnavailable('Interview monitoring events');
};

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  return backendUnavailable('Audit log');
};
