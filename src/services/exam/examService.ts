import type { Exam, ExamParticipant, ExamSchedule } from '../../types/exam';
import { backendUnavailable } from '../api/backendUnavailable';

export const getExams = async (): Promise<Exam[]> => {
  return backendUnavailable('Exam');
};

export const getExamById = async (id: number): Promise<Exam | null> => {
  void id;
  return backendUnavailable('Exam');
};

export const createExam = async (payload: Partial<Exam>): Promise<Exam> => {
  void payload;
  return backendUnavailable('Exam');
};

export const updateExam = async (id: number, payload: Partial<Exam>): Promise<Exam> => {
  void id;
  void payload;
  return backendUnavailable('Exam');
};

export const deleteExam = async (id: number): Promise<void> => {
  void id;
  return backendUnavailable('Exam');
};

export const getExamParticipants = async (examId: number): Promise<ExamParticipant[]> => {
  void examId;
  return backendUnavailable('Exam participant');
};

export const getExamSchedule = async (examId: number): Promise<ExamSchedule[]> => {
  void examId;
  return backendUnavailable('Exam schedule');
};

export const createExamSchedule = async (examId: number, payload: Partial<ExamSchedule>): Promise<ExamSchedule> => {
  void examId;
  void payload;
  return backendUnavailable('Exam schedule');
};

export const updateExamSchedule = async (
  examId: number,
  scheduleId: number,
  payload: Partial<ExamSchedule>,
): Promise<ExamSchedule> => {
  void examId;
  void scheduleId;
  void payload;
  return backendUnavailable('Exam schedule');
};

export * from './examSessionService';
