export interface RoleResponse {
  roleId: string;
  roleCode: string;
  roleName: string;
  description?: string;
  createdAt?: string;
}

export interface UserResponse {
  userId: string;
  fullName: string;
  email: string;
  studentOrStaffCode?: string;
  isActive?: boolean;
  createdAt?: string;
  roleName?: string;
  role?: RoleResponse;
}

export interface UserFilterRequest {
  userId?: string;
  fullName?: string;
  email?: string;
  studentOrStaffCode?: string;
  roleCode?: string;
  roleId?: string;
  isActive?: boolean;
  keyword?: string;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  roleCode?: string; // 'AD' | 'LE' | 'ST'
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  roleCode?: string; // 'AD' | 'LE' | 'ST'
  isActive?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

// Giữ lại kiểu cũ cho khả năng tương thích ngược nếu cần
export interface UserProfile {
  id: number;
  userId?: string;
  username?: string;
  email: string;
  fullName: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserListResponse {
  items: UserProfile[];
  total: number;
}
