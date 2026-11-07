import type { ExamSessionStatus, ExamSessionStudentStatus, StudentAssignmentStatus } from '../types/exam';
import type { BloomLevel } from '../types/rubric';
import type { ExamSessionResponse } from '../types/exam';

export const BLOOM_ORDER: BloomLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

export const normalizeBloomDistribution = (value: ExamSessionResponse['bloomDistribution']): Partial<Record<BloomLevel, number>> => {
  if (Array.isArray(value)) return Object.fromEntries(value.map((item) => [item.bloomLevel, item.questionCount])) as Partial<Record<BloomLevel, number>>;
  return value ?? {};
};

export const BLOOM_PRESENTATION: Record<BloomLevel, { label: string; color: string }> = {
  REMEMBER: { label: 'Nhớ', color: 'blue' },
  UNDERSTAND: { label: 'Hiểu', color: 'green' },
  APPLY: { label: 'Vận dụng', color: 'amber' },
  ANALYZE: { label: 'Phân tích', color: 'purple' },
  EVALUATE: { label: 'Đánh giá', color: 'red' },
  CREATE: { label: 'Sáng tạo', color: 'teal' },
};

export const SESSION_STATUS: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: 'Đã lên lịch', color: 'blue' },
  IN_PROGRESS: { label: 'Đang diễn ra', color: 'green' },
  COMPLETED: { label: 'Đã kết thúc', color: 'gray' },
  CANCELLED: { label: 'Đã hủy', color: 'red' },
  DRAFT: { label: 'Bản nháp', color: 'gray' },
};

export const STUDENT_SESSION_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chưa có giờ', color: 'gray' },
  SCHEDULED: { label: 'Đã xếp lịch', color: 'blue' },
  IN_PROGRESS: { label: 'Đang thi', color: 'green' },
  COMPLETED: { label: 'Đã thi', color: 'gray' },
  ABSENT: { label: 'Vắng', color: 'amber' },
  CANCELLED: { label: 'Đã hủy', color: 'red' },
};

export const ASSIGNMENT_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chưa có giờ', color: 'gray' },
  SCHEDULED: { label: 'Đã xếp lịch', color: 'blue' },
  IN_PROGRESS: { label: 'Đang thi', color: 'green' },
  COMPLETED: { label: 'Đã thi', color: 'gray' },
  ABSENT: { label: 'Vắng', color: 'amber' },
  CANCELLED: { label: 'Đã hủy', color: 'red' },
};

export const ATTEMPT_STATUS: Record<string, { label: string; color: string }> = {
  NOT_STARTED: { label: 'Chưa bắt đầu', color: 'gray' },
  IN_PROGRESS: { label: 'Đang thi', color: 'green' },
  COMPLETED: { label: 'Đã hoàn tất', color: 'blue' },
};

export const statusPresentation = (status: ExamSessionStatus | ExamSessionStudentStatus | StudentAssignmentStatus | string) =>
  SESSION_STATUS[status] ?? STUDENT_SESSION_STATUS[status] ?? { label: status || 'Chưa xác định', color: 'gray' };

export const validateBloomDistribution = (distribution: Partial<Record<BloomLevel, number>>, questionCount: number) => {
  const counts = BLOOM_ORDER.map((level) => Number(distribution[level] ?? 0));
  const validValues = counts.every((count) => Number.isInteger(count) && count >= 0);
  const total = counts.reduce((sum, count) => sum + count, 0);
  return { valid: validValues && total === questionCount, validValues, total, expected: questionCount };
};

export const dateTimeLocalToOffset = (value: string, offset = '+07:00'): string | null => {
  if (!value) return null;
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return null;
  return `${match[1]}T${match[2]}:${match[3] ?? '00'}${offset}`;
};

export const dateTimeToVietnamLocalInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).replace(' ', 'T').slice(0, 16);
};

export const formatExamDateTime = (value?: string | null) => {
  if (!value) return 'Chưa xếp lịch';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Chưa xác định' : new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date);
};

export interface ApiErrorDetails {
  status?: number;
  message: string;
  errorCode?: string;
  data?: unknown;
}

export const getExamErrorDetails = (error: unknown): ApiErrorDetails => {
  const response = (error as { response?: { status?: number; data?: unknown } } | null)?.response;
  const body = response?.data as { message?: unknown; errorCode?: unknown; details?: unknown; data?: { code?: unknown; errorCode?: unknown; details?: unknown; missingQuestionsByBloom?: unknown; missing?: unknown } } | undefined;
  const thrown = error as { errorCode?: unknown; data?: unknown } | null;
  const message = typeof body?.message === 'string' && body.message.trim()
    ? body.message
    : error instanceof Error && error.message
      ? error.message
      : response?.status === 403
        ? 'Không có quyền thực hiện thao tác này.'
        : 'Không thể kết nối đến máy chủ. Vui lòng thử lại.';
  const errorData = body?.details ?? body?.data?.details ?? body?.data ?? thrown?.data;
  const nested = errorData as { code?: unknown; errorCode?: unknown; missingQuestionsByBloom?: unknown; missing?: unknown; missingLevels?: unknown; missingCounts?: unknown } | undefined;
  const rawCode = body?.errorCode ?? body?.data?.errorCode ?? body?.data?.code ?? thrown?.errorCode ?? nested?.errorCode ?? nested?.code;
  return {
    status: response?.status,
    message,
    errorCode: typeof rawCode === 'string' ? rawCode : undefined,
    data: errorData,
  };
};

export const missingBloomEntries = (error: unknown): Array<{ level: string; count: number }> => {
  const details = getExamErrorDetails(error);
  if (details.errorCode !== 'SESSION_BANK_INSUFFICIENT') return [];
  const data = details.data as { missingQuestionsByBloom?: unknown; missing?: unknown; missingLevels?: unknown; missingCounts?: unknown } | undefined;
  const value = data?.missingQuestionsByBloom ?? data?.missing ?? data?.missingLevels ?? data?.missingCounts;
  if (Array.isArray(value)) return value.map((item) => {
    const row = item as { bloomLevel?: string; level?: string; count?: number; missingCount?: number };
    return { level: row.bloomLevel ?? row.level ?? 'Bloom', count: row.count ?? row.missingCount ?? 0 };
  });
  if (value && typeof value === 'object') return Object.entries(value as Record<string, number>).map(([level, count]) => ({ level, count }));
  return [];
};
