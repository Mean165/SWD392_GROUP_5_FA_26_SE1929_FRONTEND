import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tự động đính kèm JWT Token vào Header, NHƯNG bỏ qua các endpoint công khai như /auth/login, /auth/register
apiClient.interceptors.request.use((config) => {
  const url = config.url || '';
  const isPublicAuthRoute = url.includes('/auth/login') || url.includes('/auth/register');

  // Đối với endpoint login hoặc register, tuyệt đối không gửi Authorization header cũ
  if (isPublicAuthRoute) {
    if (config.headers) {
      delete config.headers.Authorization;
      delete config.headers.authorization;
    }
    return config;
  }

  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý response tập trung
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nếu token hết hạn hoặc không hợp lệ (401), xóa token lưu trong máy
    if (error?.response?.status === 401) {
      localStorage.removeItem('accessToken');
    }
    return Promise.reject(error);
  },
);

export default apiClient;
