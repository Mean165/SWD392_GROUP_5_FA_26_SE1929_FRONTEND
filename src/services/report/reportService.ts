import type { ClassReport, QuestionStatistics, ScoreDistribution, StudentReport } from '../../types/report';
import { backendUnavailable } from '../api/backendUnavailable';

export const getStudentReport = async (studentId: number, examId?: number): Promise<StudentReport | null> => {
  void studentId;
  void examId;
  return backendUnavailable('Student report');
};

export const getClassReport = async (examId: number): Promise<ClassReport | null> => {
  void examId;
  return backendUnavailable('Class report');
};

export const getQuestionStatistics = async (examId?: number): Promise<QuestionStatistics[]> => {
  void examId;
  return backendUnavailable('Question statistics');
};

export const getScoreDistribution = async (examId: number): Promise<ScoreDistribution[]> => {
  void examId;
  return backendUnavailable('Score distribution');
};

export const exportGrades = async (examId: number): Promise<Blob | null> => {
  void examId;
  return backendUnavailable('Grade export');
};
