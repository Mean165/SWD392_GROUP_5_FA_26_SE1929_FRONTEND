import apiClient from '../api/apiClient';
import type { Exam, ExamParticipant, ExamSchedule } from '../../types/exam';

export const getExams = async (): Promise<Exam[]> => {
  // TODO: connect to backend /exam
  return Promise.resolve([]);
};

export const getExamById = async (id: number): Promise<Exam | null> => {
  // TODO: connect to backend /exam/:id
  return Promise.resolve(null);
};

export const createExam = async (payload: Partial<Exam>): Promise<Exam> => {
  // TODO: connect to backend /exam
  return Promise.resolve({} as Exam);
};

export const updateExam = async (id: number, payload: Partial<Exam>): Promise<Exam> => {
  // TODO: connect to backend /exam/:id
  return Promise.resolve({} as Exam);
};

export const deleteExam = async (id: number): Promise<void> => {
  // TODO: connect to backend /exam/:id
};

export const getExamParticipants = async (examId: number): Promise<ExamParticipant[]> => {
  // TODO: connect to backend /exam/:id/participants
  return Promise.resolve([]);
};

export const getExamSchedule = async (examId: number): Promise<ExamSchedule[]> => {
  // TODO: connect to backend /exam/:id/schedule
  return Promise.resolve([]);
};

export const createExamSchedule = async (examId: number, payload: Partial<ExamSchedule>): Promise<ExamSchedule> => {
  // TODO: connect to backend /exam/:id/schedule
  return Promise.resolve({} as ExamSchedule);
};

export const updateExamSchedule = async (
  examId: number,
  scheduleId: number,
  payload: Partial<ExamSchedule>,
): Promise<ExamSchedule> => {
  // TODO: connect to backend /exam/:id/schedule/:scheduleId
  return Promise.resolve({} as ExamSchedule);
};

export * from './examSessionService';

