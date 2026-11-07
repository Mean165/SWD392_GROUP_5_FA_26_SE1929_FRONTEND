import type { ApiResponse } from '../../types/user';

export class ApiResponseError extends Error {
  constructor(message: string, readonly errorCode?: string, readonly data?: unknown) {
    super(message);
    this.name = 'ApiResponseError';
  }
}

export const unwrapApiResponse = <T>(response: unknown): T => {
  if (
    typeof response !== 'object'
    || response === null
    || !('success' in response)
    || !('data' in response)
  ) {
    throw new ApiResponseError('Máy chủ trả về dữ liệu không đúng định dạng.');
  }

  const envelope = response as ApiResponse<T>;
  if (!envelope.success) {
    const data = envelope.data as unknown;
    const code = envelope.errorCode ?? (data && typeof data === 'object' && 'code' in data ? String((data as { code?: unknown }).code ?? '') : undefined);
    throw new ApiResponseError(envelope.message || 'Yêu cầu không thành công.', code || undefined, data);
  }
  if (envelope.data === undefined || envelope.data === null) {
    throw new ApiResponseError('Máy chủ không trả về dữ liệu cần thiết.');
  }
  return envelope.data;
};
