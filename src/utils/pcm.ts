import type { SttLanguage, SttPurpose, SttStartMessage } from '../types/stt';

export const PCM_MAX_FRAME_BYTES = 24_000;

export const floatToPcm16 = (samples: Float32Array): ArrayBuffer => {
  const sampleCount = Math.min(samples.length, PCM_MAX_FRAME_BYTES / 2);
  const output = new ArrayBuffer(sampleCount * 2);
  const view = new DataView(output);
  for (let i = 0; i < sampleCount; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return output;
};

export const makeSttSocketUrl = (
  token: string,
  location: Location = window.location,
  apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '',
): string => {
  const backendUrl = /^https?:\/\//i.test(apiBaseUrl) ? new URL(apiBaseUrl) : null;
  const protocol = (backendUrl?.protocol ?? location.protocol) === 'https:' ? 'wss:' : 'ws:';
  const host = backendUrl?.host ?? location.host;
  return `${protocol}//${host}/ws/stt?access_token=${encodeURIComponent(token)}`;
};

export const makeSttStartMessage = (
  language: SttLanguage,
  purpose: SttPurpose,
  context?: { attemptId: string; turnId: string },
): SttStartMessage => {
  if (purpose === 'EXAM') {
    if (!context?.attemptId || !context.turnId) throw new Error('EXAM_CONTEXT_REQUIRED');
    return { type: 'start', language, purpose, sampleRate: 16000, encoding: 'pcm_s16le', consent: true, attemptId: context.attemptId, turnId: context.turnId };
  }
  return { type: 'start', language, purpose, sampleRate: 16000, encoding: 'pcm_s16le', consent: true };
};

export const canReconnectStt = (socketOpened: boolean, reconnectCount: number, online: boolean): boolean =>
  socketOpened && reconnectCount < 1 && online;

export const getSttErrorMessage = (code: string): string => ({
  TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  UNSUPPORTED_LANGUAGE: 'Ngôn ngữ nhận diện không được hỗ trợ. Hãy chọn Tiếng Việt hoặc English.',
  INVALID_PURPOSE: 'Không thể mở phiên nhận diện. Hãy tải lại trang.',
  EXAM_CONTEXT_REQUIRED: 'Thiếu thông tin lượt thi. Hãy tải lại trạng thái phiên thi.',
  INVALID_AUDIO_FORMAT: 'Định dạng âm thanh không hợp lệ. Hãy kiểm tra micro và thử lại.',
  RATE_LIMITED: 'Bạn đã mở quá nhiều phiên. Hãy đóng tab hoặc phiên kiểm tra thiết bị khác rồi thử lại.',
  CONSENT_REQUIRED: 'Cần đồng ý xử lý âm thanh trước khi bắt đầu.',
  START_REQUIRED: 'Phiên nhận diện chưa được khởi tạo. Hãy bắt đầu lại.',
  SESSION_ALREADY_STARTED: 'Phiên nhận diện đã bắt đầu. Hãy dừng phiên hiện tại trước.',
  SESSION_TIMEOUT: 'Phiên đã quá thời lượng cho phép. Bạn có thể chủ động bắt đầu lại.',
  STT_NOT_READY: 'STT chưa sẵn sàng. Hãy thử lại sau.',
  PROVIDER_AUTH_ERROR: 'Dịch vụ nhận diện chưa xác thực được. Hãy thử lại sau.',
  PROVIDER_QUOTA_EXCEEDED: 'Dịch vụ nhận diện đã hết lượt sử dụng. Hãy thử lại sau.',
  PROVIDER_RATE_LIMITED: 'Dịch vụ nhận diện đang bận. Hãy chờ rồi thử lại.',
  PROVIDER_PROTOCOL_ERROR: 'Dịch vụ nhận diện trả về dữ liệu không hợp lệ. Hãy thử lại sau.',
  INPUT_TOO_LARGE: 'Lượng âm thanh quá lớn. Hãy thử lại.',
  PROVIDER_TIMEOUT: 'Dịch vụ nhận diện mất quá nhiều thời gian. Transcript đã nhận vẫn được giữ; hãy thử lại khi sẵn sàng.',
  PROVIDER_UNAVAILABLE: 'Dịch vụ nhận diện hiện không khả dụng. Transcript đã nhận vẫn được giữ; hãy thử lại sau.',
  LOCAL_INFERENCE_NOT_CONFIGURED: 'Dịch vụ nhận diện cục bộ chưa được cấu hình. Hãy kiểm tra trạng thái dịch vụ rồi thử lại sau.',
  LOCAL_INFERENCE_UNAVAILABLE: 'Dịch vụ nhận diện cục bộ tạm thời không khả dụng. Hãy thử lại sau.',
  LOCAL_INFERENCE_TIMEOUT: 'Dịch vụ nhận diện cục bộ phản hồi quá lâu. Hãy thử lại sau.',
  LOCAL_INFERENCE_OVERLOADED: 'Dịch vụ nhận diện đang bận. Hãy chờ một chút rồi thử lại.',
  LOCAL_INFERENCE_PROTOCOL_ERROR: 'Dịch vụ nhận diện trả về dữ liệu không hợp lệ. Hãy thử lại sau.',
  LOCAL_INFERENCE_ERROR: 'Dịch vụ nhận diện gặp lỗi. Hãy bắt đầu phiên mới để thử lại.',
  LOCAL_STT_FAILED: 'Không thể nhận diện giọng nói. Hãy kiểm tra micro rồi nói lại.',
  LOCAL_STT_FINAL_FAILED: 'Không thể hoàn tất nhận diện giọng nói. Hãy bắt đầu phiên mới và nói lại.',
  LOCAL_REPLAY_WINDOW_EXCEEDED: 'Phiên nhận diện đã hết thời gian có thể tiếp tục. Hãy bắt đầu phiên mới.',
  TRANSCRIPT_UNRELIABLE: 'Transcript chưa đủ tin cậy. Hãy nói rõ hơn và thử lại.',
  STT_HANDSHAKE_REJECTED: 'Máy chủ từ chối kết nối. Hãy đăng nhập lại hoặc kiểm tra quyền tài khoản sinh viên.',
  NO_SPEECH: 'Chưa nhận diện được giọng nói. Hãy nói rõ hơn rồi thử lại.',
  EXAM_ATTEMPT_EXPIRED: 'Phiên thi đã hết hạn. Trạng thái phiên sẽ được tải lại.',
  EXAM_ACCESS_DENIED: 'Bạn không còn quyền truy cập phiên thi này.',
  EXAM_SUBMISSION_REJECTED: 'Máy chủ chưa chấp nhận câu trả lời. Trạng thái phiên sẽ được tải lại.',
  EXAM_SUBMISSION_FAILED: 'Không thể xử lý câu trả lời. Trạng thái phiên sẽ được tải lại.',
}[code] ?? `Dịch vụ nhận diện trả về lỗi ${code}. Hãy thử lại sau.`);

