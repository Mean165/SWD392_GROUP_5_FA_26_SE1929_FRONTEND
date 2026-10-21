type Translator = (key: string) => string;

type ApiErrorLike = {
  response?: {
    status?: number;
    data?: { message?: unknown } | string;
  };
};

export const getAdminErrorStatus = (error: unknown): number | undefined =>
  (error as ApiErrorLike | null)?.response?.status;

export const isAdminUnauthorized = (error: unknown): boolean => getAdminErrorStatus(error) === 401;

export const getAdminErrorMessage = (error: unknown, t: Translator): string => {
  const apiError = error as ApiErrorLike | null;
  const status = apiError?.response?.status;

  if (status === 401) return t('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  if (status === 403) return t('Chỉ tài khoản Admin được phép sử dụng chức năng này.');
  if (status === 500) return t('Máy chủ đang gặp sự cố. Vui lòng thử lại sau.');

  const body = apiError?.response?.data;
  const serverMessage = typeof body === 'object' && body !== null ? body.message : undefined;
  if (typeof serverMessage === 'string' && serverMessage.trim()) return serverMessage;

  if (!apiError?.response) return t('Không thể kết nối đến máy chủ. Hãy kiểm tra kết nối mạng rồi thử lại.');
  if (status === 400) return t('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.');
  if (status === 404) return t('Không tìm thấy dữ liệu được yêu cầu.');
  return t('Đã xảy ra lỗi. Vui lòng thử lại.');
};
