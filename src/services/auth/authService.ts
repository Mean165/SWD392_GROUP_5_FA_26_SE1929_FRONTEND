import apiClient from '../api/apiClient';
import type { AuthResponse, LoginRequest, RefreshTokenRequest, RegisterRequest, User } from '../../types/auth';
import type { UserRole } from '../../constants/roles';

/**
 * Gọi API POST /api/auth/register
 * Không truyền studentOrStaffCode và roleCode vì backend sẽ tự sinh
 */
export const register = async (payload: RegisterRequest): Promise<any> => {
  const response = await apiClient.post('/auth/register', {
    fullName: payload.fullName,
    email: payload.email,
    password: payload.password,
  });

  return response.data?.data ?? response.data;
};

/**
 * Gọi API POST /api/auth/login
 * Backend trả về cấu trúc: { success: true, message: "Login successful", data: LoginResponse }
 */
export const login = async (payload: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/login', {
    email: payload.email,
    password: payload.password,
  });

  const resData = response.data;
  // Hỗ trợ cả trường hợp bọc trong ApiResponse { data: ... } hoặc trả về trực tiếp
  const authData = resData?.data ?? resData;

  // Lưu Access Token vào localStorage
  if (authData?.accessToken) {
    localStorage.setItem('accessToken', authData.accessToken);
  }

  // Chuẩn hóa thông tin người dùng từ kết quả trả về
  const user: User = authData?.user ?? {
    id: authData?.userId || 1,
    userId: authData?.userId,
    email: authData?.email || payload.email,
    fullName: authData?.fullName || '',
    role: (authData?.roleName || 'STUDENT') as UserRole,
    studentOrStaffCode: authData?.studentOrStaffCode,
  };

  return {
    accessToken: authData?.accessToken,
    tokenType: authData?.tokenType,
    expiresIn: authData?.expiresIn,
    userId: authData?.userId,
    email: authData?.email,
    fullName: authData?.fullName,
    studentOrStaffCode: authData?.studentOrStaffCode,
    roleName: authData?.roleName,
    user,
  };
};

export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('accessToken');
  }
};

export const refreshToken = async (payload: RefreshTokenRequest): Promise<string> => {
  const response = await apiClient.post('/auth/refresh', payload);
  const data = response.data?.data ?? response.data;
  if (data?.accessToken) {
    localStorage.setItem('accessToken', data.accessToken);
    return data.accessToken;
  }
  return payload.refreshToken;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const response = await apiClient.get('/auth/me');
  const data = response.data?.data ?? response.data;
  return data || null;
};
