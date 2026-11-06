import axios from 'axios';
import apiClient from '../services/api/apiClient';
import { unwrapApiResponse } from '../services/api/apiResponse';
import type {
  ApprovalStatus,
  QuestionBankItem,
  QuestionRubricOverrideRequest,
  QuestionRubricResponse,
} from '../types/question';

const unwrap = <T>(response: { data: unknown }): T => unwrapApiResponse<T>(response.data);

export interface QuestionBankQuery {
  topicId?: string;
  bloomLevel?: string;
  approvalStatus?: ApprovalStatus | string;
}

export const getQuestionApiError = (error: unknown, fallback = 'Không thể hoàn tất yêu cầu.') => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const body = error.response?.data as { message?: string } | undefined;
    if (body?.message) return body.message;
    if (status === 400) return 'Dữ liệu câu hỏi không hợp lệ hoặc câu hỏi chưa có rubric.';
    if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
    if (status === 404) return 'Không tìm thấy câu hỏi hoặc rubric.';
    if (status === 409) return 'Rubric của câu hỏi đã bị khóa, không thể ghi đè.';
    if (!error.response) return 'Không thể kết nối đến máy chủ. Hãy thử lại.';
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

export const getQuestionBank = async (query: QuestionBankQuery = {}, signal?: AbortSignal): Promise<QuestionBankItem[]> => {
  const response = await apiClient.get('/questions', {
    params: {
      topicId: query.topicId || undefined,
      bloomLevel: query.bloomLevel || undefined,
      approvalStatus: query.approvalStatus || undefined,
    },
    signal,
  });
  const data = unwrap<unknown>(response);
  if (Array.isArray(data)) return data.map(normalizeQuestion);
  const page = data as { items?: QuestionBankItem[]; content?: QuestionBankItem[] } | null;
  return (page?.items ?? page?.content ?? []).map(normalizeQuestion);
};

const normalizeQuestion = (item: QuestionBankItem): QuestionBankItem => {
  const raw = item as QuestionBankItem & { id?: string; content?: string; bloom?: string; status?: string; sourceType?: QuestionBankItem['source'] };
  return {
    ...raw,
    questionId: raw.questionId ?? raw.id ?? '',
    questionText: raw.questionText ?? raw.content ?? '',
    bloomLevel: raw.bloomLevel ?? raw.bloom ?? 'REMEMBER',
    approvalStatus: raw.approvalStatus ?? raw.status ?? 'DRAFT',
    source: raw.source ?? raw.sourceType,
  };
};

export const getQuestionRubric = async (questionId: string, signal?: AbortSignal): Promise<QuestionRubricResponse> => {
  const response = await apiClient.get(`/questions/${encodeURIComponent(questionId)}/rubric`, { signal });
  return normalizeRubricResponse(unwrap<unknown>(response));
};

export const updateQuestionRubricOverride = async (
  questionId: string,
  payload: QuestionRubricOverrideRequest,
  signal?: AbortSignal,
): Promise<QuestionRubricResponse> => {
  const response = await apiClient.put(`/questions/${encodeURIComponent(questionId)}/rubric-override`, payload, { signal });
  return normalizeRubricResponse(unwrap<unknown>(response));
};

const normalizeRubricResponse = (value: unknown): QuestionRubricResponse => {
  const raw = value as Partial<QuestionRubricResponse> & { sourceType?: string; activeRubric?: QuestionRubricResponse['rubric'] };
  const rubric = raw.rubric ?? raw.activeRubric ?? (Array.isArray((value as { criteria?: unknown })?.criteria) ? value as QuestionRubricResponse['rubric'] : null);
  return {
    source: (raw.source ?? raw.sourceType ?? rubric?.source ?? 'SUBJECT') as QuestionRubricResponse['source'],
    rubric,
    criteria: raw.criteria ?? rubric?.criteria ?? [],
  };
};
