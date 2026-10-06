import apiClient from '../api/apiClient';
import type {
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilterRequest,
  ApiResponse,
} from '../../types/user';

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
  const response = await apiClient.get<ApiResponse<UserResponse>>(`/users/${id}`);
  return response.data?.data ?? (response.data as unknown as UserResponse);
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
  return response.data?.data ?? (response.data as unknown as UserResponse);
};

/**
 * Cập nhật thông tin User
 * PUT /api/users/{id}
 */
export const updateUser = async (id: string, data: UpdateUserRequest): Promise<UserResponse> => {
  const response = await apiClient.put<ApiResponse<UserResponse>>(`/users/${id}`, data);
  return response.data?.data ?? (response.data as unknown as UserResponse);
};

/**
 * Xóa một User theo ID
 * DELETE /api/users/{id}
 */
export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(`/users/${id}`);
};

export default {
  getUsers,
  getUserById,
  filterUsers,
  createUser,
  updateUser,
  deleteUser,
};
