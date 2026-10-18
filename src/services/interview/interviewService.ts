import axios from 'axios';
import { API_ENDPOINTS } from '../../constants/api';
import apiClient from '../api/apiClient';
import type { ApiResponse } from '../../types/user';
import type {
  InterviewResponse,
  SubmitAnswerPayload,
  SubmitAnswerResponse,
} from '../../types/interview';

const unwrapResponse = <T>(response: { data: ApiResponse<T> }): T => {
  if (!response.data?.success || response.data.data == null) {
    throw new Error('Máy chủ không trả về dữ liệu phiên thi hợp lệ.');
  }
  return response.data.data;
};

export const startInterview = async (sessionId: string, signal?: AbortSignal): Promise<InterviewResponse> => {
  const response = await apiClient.post<ApiResponse<InterviewResponse>>(
    `${API_ENDPOINTS.interview}/start`,
    { sessionId },
    { signal },
  );
  return unwrapResponse(response);
};

export const getInterview = async (attemptId: string, signal?: AbortSignal): Promise<InterviewResponse> => {
  const response = await apiClient.get<ApiResponse<InterviewResponse>>(
    `${API_ENDPOINTS.interview}/${encodeURIComponent(attemptId)}`,
    { signal },
  );
  return unwrapResponse(response);
};

export const getTurnSpeech = async (turnId: string, signal?: AbortSignal): Promise<Blob> => {
  const response = await apiClient.get<Blob>(
    `${API_ENDPOINTS.interview}/turns/${encodeURIComponent(turnId)}/speech`,
    { responseType: 'blob', signal, timeout: 60_000 },
  );
  if (!(response.data instanceof Blob) || response.data.size === 0) {
    throw new Error('Máy chủ không trả về tệp âm thanh hợp lệ.');
  }
  const contentType = String(response.headers['content-type'] ?? response.data.type).toLowerCase();
  if (!contentType.startsWith('audio/mpeg')) {
    throw new Error('Máy chủ trả về định dạng âm thanh không hợp lệ.');
  }
  return response.data;
};

export const submitAnswer = async (payload: SubmitAnswerPayload): Promise<SubmitAnswerResponse> => {
  const response = await apiClient.post<ApiResponse<SubmitAnswerResponse>>(
    `${API_ENDPOINTS.interview}/submit-answer`,
    payload,
    { timeout: 120_000 },
  );
  return unwrapResponse(response);
};

export const getInterviewErrorStatus = (error: unknown): number | undefined => {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
};

type InterviewErrorContext = 'load' | 'speech' | 'submit';

export const getInterviewErrorMessage = (
  error: unknown,
  context: InterviewErrorContext = 'load',
): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (!status) {
      return 'Không thể kết nối đến máy chủ. Hãy kiểm tra mạng rồi thử lại.';
    }

    switch (status) {
      case 400:
        return 'Câu trả lời hoặc trạng thái lượt thi không hợp lệ. Hãy kiểm tra nội dung và thử lại.';
      case 401:
        return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.';
      case 403:
        return 'Bạn không có quyền truy cập phiên thi hoặc lượt hỏi này.';
      case 404:
        return 'Không tìm thấy phiên thi hoặc câu hỏi hiện tại.';
      case 410:
        return 'Phiên thi đã hết hạn. Câu trả lời mới không thể được gửi.';
      case 502:
        if (context === 'submit') {
          return 'Dịch vụ xử lý giọng nói hiện gặp sự cố. Bản ghi vẫn được giữ để bạn có thể thử lại.';
        }
        return context === 'speech'
          ? 'Không thể tạo giọng đọc câu hỏi lúc này. Hãy thử tải lại âm thanh sau.'
          : 'Dịch vụ AI hiện gặp sự cố khi tải phiên thi. Vui lòng thử lại sau.';
      case 503:
        if (context === 'submit') {
          return 'Dịch vụ xử lý giọng nói hiện chưa sẵn sàng. Bản ghi vẫn được giữ để bạn có thể thử lại sau.';
        }
        return context === 'speech'
          ? 'Dịch vụ giọng đọc hiện chưa sẵn sàng. Hãy thử tải lại âm thanh sau.'
          : 'Dịch vụ AI hiện chưa sẵn sàng để tải phiên thi. Vui lòng thử lại sau.';
      default:
        return 'Đã xảy ra lỗi khi xử lý phiên thi. Vui lòng thử lại sau.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }
  return 'Đã xảy ra lỗi không xác định khi xử lý phiên thi.';
};
