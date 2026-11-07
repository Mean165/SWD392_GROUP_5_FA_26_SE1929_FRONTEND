import type { ClassReport, QuestionStatistics, ScoreDistribution, StudentReport } from '../../types/report';
import { backendUnavailable } from '../api/backendUnavailable';
import apiClient from '../api/apiClient';
import { unwrapApiResponse } from '../api/apiResponse';
import type { PageResponse, StudentSessionAssignmentResponse } from '../../types/exam';

export const getLecturerOfficialExamResults = async (examId: string): Promise<PageResponse<StudentSessionAssignmentResponse>> => {
  const response = await apiClient.get(`/reports/lecturers/exams/${encodeURIComponent(examId)}/official-results`, { params: { page: 0, size: 200 } });
  const data = unwrapApiResponse<unknown>(response.data);
  if (data && typeof data === 'object' && 'content' in data && Array.isArray((data as PageResponse<StudentSessionAssignmentResponse>).content)) return data as PageResponse<StudentSessionAssignmentResponse>;
  const content = Array.isArray(data) ? data as StudentSessionAssignmentResponse[] : [];
  return { content, page: 0, size: content.length, totalElements: content.length, totalPages: content.length ? 1 : 0 };
};

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
