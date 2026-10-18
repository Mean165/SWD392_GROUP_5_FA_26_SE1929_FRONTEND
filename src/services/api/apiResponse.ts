import type { ApiResponse } from '../../types/user';

export class ApiResponseError extends Error {
  constructor(message: string) {
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
    throw new ApiResponseError(envelope.message || 'Yêu cầu không thành công.');
  }
  if (envelope.data === undefined || envelope.data === null) {
    throw new ApiResponseError('Máy chủ không trả về dữ liệu cần thiết.');
  }
  return envelope.data;
};
