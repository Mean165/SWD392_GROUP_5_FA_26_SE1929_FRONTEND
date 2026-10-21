import axios from 'axios';
import type {
  CreateGenerationJobRequest,
  GenerationJob,
  PageResult,
  Question,
  QuestionDetail,
  QuestionDocument,
  QuestionImportRequest,
  QuestionListQuery,
  QuestionSummary,
  SubjectOption,
  TopicOption,
  UpdateQuestionRequest,
  GenerateQuestionRequest,
} from '../../types/question';
import type { Rubric } from '../../types/rubric';
import { backendUnavailable } from '../api/backendUnavailable';
import apiClient from '../api/apiClient';
import { unwrapApiResponse } from '../api/apiResponse';
import { API_ENDPOINTS } from '../../constants/api';

const unwrap = <T>(response: { data: unknown }): T => unwrapApiResponse<T>(response.data);
const QUESTION_GENERATION_ENDPOINT = API_ENDPOINTS.questionGeneration;

export const getQuestions = async (): Promise<Question[]> => {
  return backendUnavailable('Question bank');
};

export const getQuestionById = async (id: number): Promise<Question | null> => {
  void id;
  return backendUnavailable('Question bank');
};

export const createQuestion = async (payload: Partial<Question>): Promise<Question> => {
  void payload;
  return backendUnavailable('Question bank');
};

export const updateQuestion = async (id: number, payload: Partial<Question>): Promise<Question> => {
  void id;
  void payload;
  return backendUnavailable('Question bank');
};

export const deleteQuestion = async (id: number): Promise<void> => {
  void id;
  return backendUnavailable('Question bank');
};

export const importQuestions = async (payload: QuestionImportRequest): Promise<Question[]> => {
  void payload;
  return backendUnavailable('Question import');
};

export const generateQuestions = async (payload: GenerateQuestionRequest): Promise<Question[]> => {
  void payload;
  return backendUnavailable('AI/RAG question generation');
};

export const getRubric = async (questionId?: number): Promise<Rubric | null> => {
  void questionId;
  return backendUnavailable('Rubric');
};

export const createRubric = async (payload: Rubric): Promise<Rubric> => {
  void payload;
  return backendUnavailable('Rubric');
};

export const updateRubric = async (id: number, payload: Rubric): Promise<Rubric> => {
  void id;
  void payload;
  return backendUnavailable('Rubric');
};

export const getQuestionGenerationSubjects = async (signal?: AbortSignal): Promise<SubjectOption[]> => {
  const response = await apiClient.get(`${QUESTION_GENERATION_ENDPOINT}/subjects`, { signal });
  return unwrap(response);
};

export const getQuestionGenerationTopics = async (subjectId: string, signal?: AbortSignal): Promise<TopicOption[]> => {
  const response = await apiClient.get(`${QUESTION_GENERATION_ENDPOINT}/subjects/${encodeURIComponent(subjectId)}/topics`, { signal });
  return unwrap(response);
};

export const uploadQuestionDocument = async (
  subjectId: string,
  topicId: string,
  file: File,
  signal?: AbortSignal,
): Promise<QuestionDocument> => {
  const body = new FormData();
  body.append('file', file);
  const response = await apiClient.post(`${QUESTION_GENERATION_ENDPOINT}/documents`, body, {
    params: { subjectId, topicId },
    signal,
  });
  return unwrap(response);
};

export const getQuestionDocuments = async (
  subjectId: string,
  topicId: string,
  signal?: AbortSignal,
): Promise<QuestionDocument[]> => {
  const response = await apiClient.get(`${QUESTION_GENERATION_ENDPOINT}/documents`, {
    params: { subjectId, topicId },
    signal,
  });
  return unwrap(response);
};

export const getQuestionDocument = async (documentId: string, signal?: AbortSignal): Promise<QuestionDocument> => {
  const response = await apiClient.get(`${QUESTION_GENERATION_ENDPOINT}/documents/${encodeURIComponent(documentId)}`, { signal });
  return unwrap(response);
};

export const deleteQuestionDocument = async (documentId: string, signal?: AbortSignal): Promise<void> => {
  const response = await apiClient.delete(`${QUESTION_GENERATION_ENDPOINT}/documents/${encodeURIComponent(documentId)}`, { signal });
  const envelope = response.data as { success?: boolean; message?: string; data?: unknown };
  if (!envelope || envelope.success !== true) {
    throw new Error(envelope?.message || 'The document could not be deleted.');
  }
};

export const createQuestionGenerationJob = async (
  payload: CreateGenerationJobRequest,
  signal?: AbortSignal,
): Promise<GenerationJob> => {
  const response = await apiClient.post(`${QUESTION_GENERATION_ENDPOINT}/jobs`, payload, { signal });
  return unwrap(response);
};

export const getQuestionGenerationJob = async (jobId: string, signal?: AbortSignal): Promise<GenerationJob> => {
  const response = await apiClient.get(`${QUESTION_GENERATION_ENDPOINT}/jobs/${encodeURIComponent(jobId)}`, { signal });
  return unwrap(response);
};

export const getGenerationQuestions = async (
  query: QuestionListQuery = {},
  signal?: AbortSignal,
): Promise<PageResult<QuestionSummary>> => {
  const response = await apiClient.get(`${QUESTION_GENERATION_ENDPOINT}/questions`, { params: query, signal });
  return unwrap(response);
};

export const getGenerationQuestionById = async (questionId: string, signal?: AbortSignal): Promise<QuestionDetail> => {
  const response = await apiClient.get(`${QUESTION_GENERATION_ENDPOINT}/questions/${encodeURIComponent(questionId)}`, { signal });
  return unwrap(response);
};

export const updateGenerationQuestion = async (
  questionId: string,
  payload: UpdateQuestionRequest,
  signal?: AbortSignal,
): Promise<QuestionDetail> => {
  const response = await apiClient.put(`${QUESTION_GENERATION_ENDPOINT}/questions/${encodeURIComponent(questionId)}`, payload, { signal });
  return unwrap(response);
};

export const approveGenerationQuestion = async (questionId: string, signal?: AbortSignal): Promise<QuestionDetail> => {
  const response = await apiClient.post(`${QUESTION_GENERATION_ENDPOINT}/questions/${encodeURIComponent(questionId)}/approve`, undefined, { signal });
  return unwrap(response);
};

export const approveGenerationQuestions = async (
  questionIds: string[],
  signal?: AbortSignal,
): Promise<QuestionDetail[]> => {
  const response = await apiClient.post(`${QUESTION_GENERATION_ENDPOINT}/questions/approve-bulk`, { questionIds }, { signal });
  return unwrap(response);
};

export const rejectGenerationQuestion = async (questionId: string, signal?: AbortSignal): Promise<{ questionId: string; status: 'REJECTED' }> => {
  const response = await apiClient.post(`${QUESTION_GENERATION_ENDPOINT}/questions/${encodeURIComponent(questionId)}/reject`, undefined, { signal });
  return unwrap(response);
};

export const getQuestionGenerationErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

export const getQuestionGenerationRetryAfter = (error: unknown): string | null => {
  if (!axios.isAxiosError(error) || error.response?.status !== 429) return null;
  const header = error.response.headers['retry-after'];
  return header === undefined ? null : String(header);
};
