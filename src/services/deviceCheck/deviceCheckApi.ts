import axios from 'axios';
import apiClient from '../api/apiClient';
import { unwrapApiResponse } from '../api/apiResponse';
import type { DeviceCheckConfig, DeviceCheckSttResult } from '../../types/deviceCheck';

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
  400: 'Dữ liệu kiểm tra không hợp lệ. Hãy kiểm tra lại ngôn ngữ và bản ghi.',
  401: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
  403: 'Tài khoản hiện tại không có quyền dùng chức năng kiểm tra thiết bị dành cho sinh viên.',
  413: 'Bản ghi quá lớn. Hãy ghi âm ngắn hơn rồi thử lại.',
  415: 'Định dạng bản ghi không được hỗ trợ. Hãy dùng trình duyệt khác hoặc chọn lại micro.',
  429: 'Bạn đã kiểm tra quá nhiều lần. Vui lòng chờ trước khi thử lại.',
  502: 'Dịch vụ AI đang gặp sự cố. Bản ghi vẫn còn trên thiết bị; bạn có thể thử lại.',
  503: 'Dịch vụ AI hiện chưa sẵn sàng. Bản ghi vẫn được giữ để bạn thử lại sau.',
  410: 'Phiên kiểm tra đã hết hạn. Hãy quay lại trang lịch thi và mở lại kiểm tra thiết bị.',
};

export const getDeviceCheckError = (error: unknown): DeviceCheckApiError => {
  if (error instanceof DeviceCheckApiError) return error;
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const retryAfterHeader = error.response?.headers?.['retry-after'];
    const parsedRetryAfter = Number.parseInt(String(retryAfterHeader ?? ''), 10);
    const retryAfterSeconds = Number.isFinite(parsedRetryAfter) && parsedRetryAfter > 0
      ? parsedRetryAfter
      : undefined;
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

export const getDeviceCheckConfig = async (): Promise<DeviceCheckConfig> => {
  try {
    const response = await apiClient.get('/student/device-check/config');
    return unwrapApiResponse<DeviceCheckConfig>(response.data);
  } catch (error) {
    throw getDeviceCheckError(error);
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
    if (!(response.data instanceof Blob) || response.data.size === 0 || !contentType.startsWith('audio/mpeg')) {
      throw new DeviceCheckApiError('Máy chủ không trả về tệp âm thanh MP3 hợp lệ.');
    }
    return response.data;
  } catch (error) {
    throw getDeviceCheckError(error);
  }
};

export const postDeviceCheckStt = async (file: File, language: string): Promise<DeviceCheckSttResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    const response = await apiClient.post('/student/device-check/stt', formData, {
      timeout: 120_000,
      headers: { 'Content-Type': undefined },
    });
    return unwrapApiResponse<DeviceCheckSttResult>(response.data);
  } catch (error) {
    throw getDeviceCheckError(error);
  }
};
