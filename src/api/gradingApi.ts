import axios from 'axios';
import apiClient from '../services/api/apiClient';
import { unwrapApiResponse } from '../services/api/apiResponse';
import type { GradingQueueEntry, GradingQueuePage, GradingSubmissionDetail, GradingSuggestion, GradingSubmissionTurn, LecturerCriterionScore } from '../types/evaluation';

export interface GradingQueueFilters {
  examId?: string;
  status?: string;
  page?: number;
  size?: number;
  finishedFrom?: string;
  finishedTo?: string;
}

export const getGradingQueue = async (filters: GradingQueueFilters = {}, signal?: AbortSignal): Promise<GradingQueuePage> => {
  const response = await apiClient.get('/v1/grading/queue', { params: filters, signal });
  const data = unwrapApiResponse<unknown>(response.data) as Partial<GradingQueuePage>;
  return {
    items: Array.isArray(data.items) ? data.items.map(normalizeQueueEntry) : [],
    page: data.page ?? filters.page ?? 0,
    size: data.size ?? filters.size ?? 20,
    total: data.total ?? 0,
  };
};

export const getGradingSubmission = async (submissionId: string, signal?: AbortSignal): Promise<GradingSubmissionDetail> => {
  const response = await apiClient.get(`/v1/grading/submissions/${encodeURIComponent(submissionId)}`, { signal });
  const raw = unwrapApiResponse<Record<string, unknown>>(response.data);
  const base = normalizeQueueEntry(raw);
  const subjectRubricCriteria = Array.isArray(raw.subjectRubricCriteria)
    ? raw.subjectRubricCriteria.map(normalizeRubricCriterion).filter((criterion) => criterion.criterionId)
    : [];
  const snapshotRubricCriteria = readRubricCriteria(raw.rubricSnapshot ?? raw.rubric_snapshot);
  return {
    ...base,
    turns: Array.isArray(raw.turns) ? raw.turns.map(normalizeTurn) : [],
    aiSuggestions: Array.isArray(raw.aiSuggestions) ? raw.aiSuggestions.map(normalizeSuggestion) : [],
    rubricCriteria: subjectRubricCriteria.length ? subjectRubricCriteria : snapshotRubricCriteria,
    lecturerScores: Array.isArray(raw.lecturerScores) ? raw.lecturerScores.map(normalizeLecturerScore) : [],
    questionMaxScores: readQuestionMaxScores(raw.questionMaxScores ?? raw.question_max_scores),
  };
};

export const claimGradingSubmission = async (submissionId: string): Promise<Record<string, unknown>> => {
  const response = await apiClient.post(`/v1/grading/submissions/${encodeURIComponent(submissionId)}/claim`);
  return unwrapApiResponse<Record<string, unknown>>(response.data);
};

export const renewGradingLock = async (submissionId: string): Promise<Record<string, unknown>> => {
  const response = await apiClient.put(`/v1/grading/submissions/${encodeURIComponent(submissionId)}/lock`);
  return unwrapApiResponse<Record<string, unknown>>(response.data);
};

export const enqueueGradingAiRun = async (submissionId: string): Promise<Record<string, unknown>> => {
  const response = await apiClient.post(`/v1/grading/submissions/${encodeURIComponent(submissionId)}/ai-runs`);
  return unwrapApiResponse<Record<string, unknown>>(response.data);
};

export const saveGradingScores = async (
  submissionId: string,
  version: number,
  scores: Array<{ questionId: string; criterionId: string; score: number; maxScore: number; source: 'MANUAL'; overrideReason: null; comment: string | null }>,
  useAiQuestionIds: string[] = [],
): Promise<void> => {
  await apiClient.put(`/v1/grading/submissions/${encodeURIComponent(submissionId)}/scores`, { scores, useAiQuestionIds, version });
};

export const getGradingErrorMessage = (error: unknown, fallback = 'Không thể tải bài thi cần chấm.'): string => {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { message?: string; errorCode?: string } | undefined;
    const status = error.response?.status;
    if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    if (status === 403) return 'Tài khoản không có quyền xem hàng đợi chấm điểm.';
    if (status === 404) return 'Không tìm thấy bài thi này.';
    if (!error.response) return 'Không thể kết nối máy chủ. Hãy thử lại.';
    if (body?.message) return body.errorCode ? `${body.message} (${body.errorCode})` : body.message;
    if (status && status >= 500) return `Máy chủ gặp lỗi HTTP ${status} khi xử lý chấm điểm.`;
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

const normalizeQueueEntry = (value: unknown): GradingQueueEntry => {
  const raw = value as Record<string, unknown>;
  return {
    submissionId: String(raw.submissionId ?? raw.submission_id ?? ''),
    examId: String(raw.examId ?? raw.exam_id ?? ''),
    examName: String(raw.examName ?? raw.exam_name ?? 'Kỳ thi'),
    studentId: String(raw.studentId ?? raw.student_id ?? ''),
    studentName: String(raw.studentName ?? raw.student_name ?? 'Học sinh'),
    attemptNo: Number(raw.attemptNo ?? raw.attempt_no ?? 1),
    status: String(raw.status ?? 'WAITING_SESSION'),
    aiStatus: String(raw.aiStatus ?? raw.ai_status ?? 'PENDING'),
    priorityScore: Number(raw.priorityScore ?? raw.priority_score ?? 0),
    sessionFinishedAt: optionalString(raw.sessionFinishedAt ?? raw.session_finished_at),
    aiScoredAt: optionalString(raw.aiScoredAt ?? raw.ai_scored_at),
    finalizedAt: optionalString(raw.finalizedAt ?? raw.finalized_at),
    lecturerTotalScore: optionalNumber(raw.lecturerTotalScore ?? raw.lecturer_total_score),
    version: Number(raw.version ?? 0),
  };
};

const normalizeTurn = (value: unknown): GradingSubmissionTurn => {
  const raw = value as Record<string, unknown>;
  return {
    turnId: String(raw.turnId ?? raw.turn_id ?? ''),
    questionId: optionalString(raw.questionId ?? raw.main_question_id),
    turnOrder: Number(raw.turnOrder ?? raw.turn_order ?? 0),
    turnType: String(raw.turnType ?? raw.turn_type ?? 'MAIN'),
    bloomLevel: optionalString(raw.bloomLevel ?? raw.bloom_level),
    questionText: String(raw.questionText ?? raw.ai_question_text ?? ''),
    transcriptText: optionalString(raw.transcriptText ?? raw.transcript_text),
    normalizedText: optionalString(raw.normalizedText ?? raw.text_normalized),
    needsHumanReview: Boolean(raw.needsHumanReview ?? raw.needs_human_review),
  };
};

const normalizeSuggestion = (value: unknown): GradingSuggestion => {
  const raw = value as Record<string, unknown>;
  return {
    questionId: optionalString(raw.questionId ?? raw.question_id),
    criteriaId: optionalString(raw.criteriaId ?? raw.criteria_id),
    criteriaName: String(raw.criteriaName ?? raw.criteria_name ?? 'Tiêu chí'),
    points: raw.aiSuggestedPoints == null && raw.ai_suggested_points == null ? null : Number(raw.aiSuggestedPoints ?? raw.ai_suggested_points),
    missingConcepts: optionalString(raw.missingConcepts ?? raw.missing_concepts),
    reasoning: optionalString(raw.aiExplanationReasoning ?? raw.ai_explanation_reasoning),
  };
};

const normalizeLecturerScore = (value: unknown): LecturerCriterionScore => {
  const raw = value as Record<string, unknown>;
  return {
    questionId: String(raw.questionId ?? raw.question_id ?? ''),
    criterionId: String(raw.criterionId ?? raw.criterion_id ?? ''),
    score: Number(raw.score ?? 0),
    maxScore: Number(raw.maxScore ?? raw.max_score ?? 0),
    source: String(raw.source ?? 'MANUAL'),
    comment: optionalString(raw.comment),
    overrideReason: optionalString(raw.overrideReason ?? raw.override_reason),
  };
};

const readRubricCriteria = (value: unknown) => {
  const initial = typeof value === 'string' ? parseJson(value) : value;
  const wrapped = initial as { value?: unknown } | null;
  const snapshot = typeof wrapped?.value === 'string' ? parseJson(wrapped.value) : initial;
  if (!snapshot || typeof snapshot !== 'object') return [];
  const criteria = (snapshot as { criteria?: unknown }).criteria;
  if (!Array.isArray(criteria)) return [];
  return criteria.map(normalizeRubricCriterion).filter((item) => item.criterionId);
};

const readQuestionMaxScores = (value: unknown): Record<string, number> => {
  const parsed = typeof value === 'string' ? parseJson(value) : value;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  return Object.fromEntries(Object.entries(parsed).flatMap(([questionId, score]) => {
    const numericScore = Number(score);
    return Number.isFinite(numericScore) && numericScore > 0 ? [[questionId, numericScore]] : [];
  }));
};

const normalizeRubricCriterion = (value: unknown) => {
  const raw = value as Record<string, unknown>;
  const normalizedKeys = Object.fromEntries(Object.entries(raw).map(([key, item]) => [
    key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase(),
    item,
  ]));
  return {
    criterionId: String(raw.criterionId ?? raw.criteriaId ?? raw.criterion_id ?? raw.criteria_id
      ?? raw.rubric_criteria_id ?? raw.id ?? normalizedKeys.criterion_id ?? normalizedKeys.criteria_id
      ?? normalizedKeys.rubric_criteria_id ?? normalizedKeys.id ?? ''),
    name: String(raw.name ?? raw.criteriaName ?? raw.criteria_name ?? normalizedKeys.criteria_name ?? 'Tiêu chí'),
    expectedPoints: String(raw.expectedPoints ?? raw.expectedKnowledgePoints ?? raw.expected_knowledge_points
      ?? normalizedKeys.expected_knowledge_points ?? ''),
    weight: Number(raw.weight ?? raw.weightRatio ?? raw.weight_ratio ?? normalizedKeys.weight_ratio ?? 0),
  };
};

const parseJson = (value: string): unknown => {
  try { return JSON.parse(value) as unknown; } catch { return null; }
};

const optionalString = (value: unknown): string | null => value == null || value === '' ? null : String(value);
const optionalNumber = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
