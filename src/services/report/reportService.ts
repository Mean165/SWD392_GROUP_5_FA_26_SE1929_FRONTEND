import apiClient from '../api/apiClient';
import type { ClassReport, QuestionStatistics, ScoreDistribution, StudentReport } from '../../types/report';

export const getStudentReport = async (studentId: number, examId?: number): Promise<StudentReport | null> => {
  // TODO: connect to backend /report/student
  return Promise.resolve(null);
};

export const getClassReport = async (examId: number): Promise<ClassReport | null> => {
  // TODO: connect to backend /report/class
  return Promise.resolve(null);
};

export const getQuestionStatistics = async (examId?: number): Promise<QuestionStatistics[]> => {
  // TODO: connect to backend /report/question-statistics
  return Promise.resolve([]);
};

export const getScoreDistribution = async (examId: number): Promise<ScoreDistribution[]> => {
  // TODO: connect to backend /report/score-distribution
  return Promise.resolve([]);
};

export const exportGrades = async (examId: number): Promise<Blob | null> => {
  // TODO: connect to backend /report/export-grades
  return Promise.resolve(null);
};
