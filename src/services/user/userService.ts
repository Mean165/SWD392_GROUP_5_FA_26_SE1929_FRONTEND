import apiClient from '../api/apiClient';
import type {
  AdminUser,
  AdminUserQuery,
  PageResponse,
  PasswordResetRequest,
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilterRequest,
  ApiResponse,
} from '../../types/user';

const unwrap = <T>(payload: ApiResponse<T>): T => {
  if (!payload || payload.success !== true || payload.data === null || payload.data === undefined) {
    throw new Error(payload?.message || 'The server returned an invalid response.');
  }
  return payload.data;
};

const userPath = (id: string) => `/users/${encodeURIComponent(id)}`;

export const getAdminUsers = async (params: AdminUserQuery): Promise<PageResponse<AdminUser>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<AdminUser>>>('/users/admin', { params });
  return unwrap(response.data);
};

/**
 * Service quản lý các API liên quan đến User trong hệ thống AIVES
 * Tuân thủ backend UserController: /api/users
 */

/**
 * Lấy danh sách toàn bộ User
 * GET /api/users
 */
export const getUsers = async (): Promise<UserResponse[]> => {
  const response = await apiClient.get<ApiResponse<UserResponse[]>>('/users');
  return response.data?.data ?? (response.data as unknown as UserResponse[]) ?? [];
};

/**
 * Lấy thông tin chi tiết một User theo ID hoặc "me" cho tài khoản hiện tại
 * GET /api/users/{id}
 */
export const getUserById = async (id: string): Promise<UserResponse> => {
  const response = await apiClient.get<ApiResponse<UserResponse>>(userPath(id));
  return unwrap(response.data);
};

/**
 * Lọc danh sách User theo tên, email, role
 * POST /api/users/filter
 */
export const filterUsers = async (params: UserFilterRequest): Promise<UserResponse[]> => {
  const response = await apiClient.post<ApiResponse<UserResponse[]>>('/users/filter', params);
  return response.data?.data ?? (response.data as unknown as UserResponse[]) ?? [];
};

/**
 * Tạo mới một User
 * POST /api/users
 */
export const createUser = async (data: CreateUserRequest): Promise<UserResponse> => {
  const response = await apiClient.post<ApiResponse<UserResponse>>('/users', data);
  return unwrap(response.data);
};

/**
 * Cập nhật thông tin User
 * PUT /api/users/{id}
 */
export const updateUser = async (id: string, data: UpdateUserRequest): Promise<UserResponse> => {
  const response = await apiClient.put<ApiResponse<UserResponse>>(userPath(id), data);
  return unwrap(response.data);
};

export const lockUser = async (id: string): Promise<UserResponse> => {
  const response = await apiClient.post<ApiResponse<UserResponse>>(`${userPath(id)}/lock`);
  return unwrap(response.data);
};

export const unlockUser = async (id: string): Promise<UserResponse> => {
  const response = await apiClient.post<ApiResponse<UserResponse>>(`${userPath(id)}/unlock`);
  return unwrap(response.data);
};

export const resetUserPassword = async (id: string, payload: PasswordResetRequest): Promise<null> => {
  const response = await apiClient.post<ApiResponse<null>>(`${userPath(id)}/password-reset`, payload);
  if (!response.data || response.data.success !== true) {
    throw new Error(response.data?.message || 'The server returned an invalid response.');
  }
  return null;
};

export const deleteStudentAccount = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/${encodeURIComponent(id)}`);
};

export default {
  getAdminUsers,
  getUsers,
  getUserById,
  filterUsers,
  createUser,
  updateUser,
  lockUser,
  unlockUser,
  resetUserPassword,
  deleteStudentAccount,
};
