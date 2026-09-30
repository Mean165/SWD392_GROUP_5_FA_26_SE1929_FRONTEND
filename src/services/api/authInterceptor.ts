import apiClient from './apiClient';

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // TODO: handle unauthorized, refresh token, and generic API errors
    return Promise.reject(error);
  },
);

export default apiClient;
