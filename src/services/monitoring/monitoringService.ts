import apiClient from '../api/apiClient';
import type { AuditLog, ExamEvent, ExamRecording, InterviewEvent } from '../../types/monitoring';

export const getExamRecording = async (examId: number): Promise<ExamRecording | null> => {
  // TODO: connect to backend /monitoring/exam-recording/:examId
  return Promise.resolve(null);
};

export const getExamEvents = async (examId: number): Promise<ExamEvent[]> => {
  // TODO: connect to backend /monitoring/exam-events/:examId
  return Promise.resolve([]);
};

export const getInterviewEvents = async (interviewId: number): Promise<InterviewEvent[]> => {
  // TODO: connect to backend /monitoring/interview-events/:interviewId
  return Promise.resolve([]);
};

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  // TODO: connect to backend /monitoring/audit-logs
  return Promise.resolve([]);
};
