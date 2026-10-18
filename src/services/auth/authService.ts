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
 * Chuẩn hóa Role từ Backend (hỗ trợ cả mã AD/LE/ST lẫn ADMIN/LECTURER/STUDENT)
 */
export const normalizeRole = (rawRole?: string): UserRole => {
  const role = (rawRole || '').trim().toUpperCase();
  if (role === 'AD' || role === 'ADMIN') return 'ADMIN';
  if (role === 'LE' || role === 'LECTURER') return 'LECTURER';
  return 'STUDENT';
};

/**
 * Gọi API POST /api/auth/login
 * Backend trả về cấu trúc: { success: true, message: "Login successful", data: LoginResponse }
 */
export const login = async (payload: LoginRequest): Promise<AuthResponse> => {
  // Xóa token cũ trước khi gửi đăng nhập mới để tránh gửi header Authorization không hợp lệ
  localStorage.removeItem('accessToken');

  const response = await apiClient.post('/auth/login', {
    email: payload.email.trim(),
    password: payload.password,
  });

  const resData = response.data;
  // Hỗ trợ cả trường hợp bọc trong ApiResponse { data: ... } hoặc trả về trực tiếp
  const authData = resData?.data ?? resData;

  // Lưu Access Token vào localStorage
  if (authData?.accessToken) {
    localStorage.setItem('accessToken', authData.accessToken);
  }

  // Chuẩn hóa role người dùng
  const role = normalizeRole(authData?.roleName || authData?.user?.role?.roleCode || authData?.user?.roleName);

  // Chuẩn hóa thông tin người dùng từ kết quả trả về
  const user: User = {
    id: authData?.userId || authData?.user?.userId || 1,
    userId: authData?.userId || authData?.user?.userId,
    email: authData?.email || authData?.user?.email || payload.email.trim(),
    fullName: authData?.fullName || authData?.user?.fullName || '',
    role,
    studentOrStaffCode: authData?.studentOrStaffCode || authData?.user?.studentOrStaffCode,
  };

  return {
    accessToken: authData?.accessToken,
    tokenType: authData?.tokenType,
    expiresIn: authData?.expiresIn,
    userId: authData?.userId,
    email: authData?.email,
    fullName: authData?.fullName,
    studentOrStaffCode: authData?.studentOrStaffCode,
    roleName: role,
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
