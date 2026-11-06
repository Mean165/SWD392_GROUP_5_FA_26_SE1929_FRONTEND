import axios from 'axios';
import apiClient from '../services/api/apiClient';
import { unwrapApiResponse } from '../services/api/apiResponse';
import type { SubjectRubric, SubjectRubricInput, SubjectRubricStats } from '../types/rubric';
import type { SubjectOption, TopicOption } from '../types/question';

const unwrap = <T>(response: { data: unknown }): T => unwrapApiResponse<T>(response.data);

export interface RubricApiError extends Error { status?: number; errorCode?: string }

export const getRubricApiError = (error: unknown, fallback = 'Unable to complete the rubric request.'): RubricApiError => {
  if (axios.isAxiosError(error)) {
    const result = new Error(fallback) as RubricApiError;
    result.status = error.response?.status;
    result.errorCode = (error.response?.data as { errorCode?: string } | undefined)?.errorCode;
    return result;
  }
  if (error instanceof Error) return error as RubricApiError;
  return new Error(fallback) as RubricApiError;
};

export const getRubricSubjects = async (signal?: AbortSignal): Promise<SubjectOption[]> => {
  const response = await apiClient.get('/question-generation/subjects', { signal });
  return unwrap<SubjectOption[]>(response);
};

export const getRubricTopics = async (subjectId: string, signal?: AbortSignal): Promise<TopicOption[]> => {
  const response = await apiClient.get(`/question-generation/subjects/${encodeURIComponent(subjectId)}/topics`, { signal });
  return unwrap<TopicOption[]>(response);
};

export const getSubjectRubric = async (subjectId: string, signal?: AbortSignal): Promise<SubjectRubric> => {
  const response = await apiClient.get(`/subjects/${encodeURIComponent(subjectId)}/rubric`, { signal });
  return unwrap<SubjectRubric>(response);
};

export const getSubjectRubricStats = async (subjectId: string, signal?: AbortSignal): Promise<SubjectRubricStats> => {
  const response = await apiClient.get(`/subjects/${encodeURIComponent(subjectId)}/rubric/stats`, { signal });
  return unwrap<SubjectRubricStats>(response);
};

export const createSubjectRubric = async (subjectId: string, payload: SubjectRubricInput): Promise<SubjectRubric> => {
  const response = await apiClient.post(`/subjects/${encodeURIComponent(subjectId)}/rubric`, payload);
  return unwrap<SubjectRubric>(response);
};

export const updateSubjectRubric = async (subjectId: string, payload: SubjectRubricInput): Promise<SubjectRubric> => {
  const response = await apiClient.put(`/subjects/${encodeURIComponent(subjectId)}/rubric`, payload);
  return unwrap<SubjectRubric>(response);
};

export const deleteSubjectRubric = async (subjectId: string): Promise<void> => {
  await apiClient.delete(`/subjects/${encodeURIComponent(subjectId)}/rubric`);
};
