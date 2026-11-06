import axios from 'axios';
import apiClient from '../api/apiClient';
import type { SttHealthResponse } from '../../types/stt';

export class DeviceCheckApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'DeviceCheckApiError';
  }
}

const errorMessages: Record<number, string> = {
  400: 'Đã xảy ra lỗi khi kiểm tra thiết bị. Vui lòng thử lại.',
  401: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
  403: 'Tài khoản hiện tại không có quyền dùng chức năng kiểm tra thiết bị dành cho sinh viên.',
  429: 'Dịch vụ đang bận. Hãy chờ một chút rồi thử lại.',
  502: 'Dịch vụ nhận diện hiện không khả dụng. Hãy thử lại sau.',
  503: 'STT chưa sẵn sàng. Hãy thử lại sau.',
};

export const getDeviceCheckError = (error: unknown, context: 'tts' | 'stt' = 'stt'): DeviceCheckApiError => {
  if (error instanceof DeviceCheckApiError) return error;
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const retryAfterHeader = error.response?.headers?.['retry-after'];
    const parsedRetryAfter = Number.parseInt(String(retryAfterHeader ?? ''), 10);
    const retryAfterSeconds = Number.isFinite(parsedRetryAfter) && parsedRetryAfter > 0
      ? parsedRetryAfter
      : undefined;
    if (context === 'tts' && (status === 502 || status === 503)) {
      return new DeviceCheckApiError('Không thể tải âm thanh mẫu từ máy chủ. Hãy thử lại sau.', status, retryAfterSeconds);
    }
    if (!status) {
      return new DeviceCheckApiError('Không thể kết nối đến máy chủ. Hãy kiểm tra kết nối mạng rồi thử lại.');
    }
    return new DeviceCheckApiError(
      errorMessages[status] ?? 'Đã xảy ra lỗi khi kiểm tra thiết bị. Vui lòng thử lại.',
      status,
      retryAfterSeconds,
    );
  }
  return new DeviceCheckApiError('Máy chủ trả về dữ liệu không hợp lệ. Vui lòng thử lại.');
};

export const getDeviceCheckSttHealth = async (): Promise<SttHealthResponse> => {
  try {
    const response = await apiClient.get<SttHealthResponse>('/student/device-check/stt/health', { timeout: 10_000 });
    if (!response.data?.stt || !response.data?.tts) throw new DeviceCheckApiError('Máy chủ trả về trạng thái dịch vụ không hợp lệ. Vui lòng thử lại.');
    return response.data;
  } catch (error) {
    throw getDeviceCheckError(error, 'stt');
  }
};

export const getDeviceCheckTts = async (language: string, signal?: AbortSignal): Promise<Blob> => {
  try {
    const response = await apiClient.get<Blob>('/student/device-check/tts', {
      params: { language },
      responseType: 'blob',
      timeout: 60_000,
      signal,
    });
    const contentType = String(response.headers['content-type'] ?? '').toLowerCase();
    if (!(response.data instanceof Blob) || response.data.size === 0
      || !(contentType.startsWith('audio/mpeg') || contentType.startsWith('audio/wav') || contentType.startsWith('audio/wave'))) {
      throw new DeviceCheckApiError('Máy chủ không trả về tệp âm thanh MP3 hợp lệ.');
    }
    return response.data;
  } catch (error) {
    throw getDeviceCheckError(error, 'tts');
  }
};
