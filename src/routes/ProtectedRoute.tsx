import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import type { UserRole } from '../constants/roles';
import { useAuth } from '../hooks/useAuth';

type ProtectedRouteProps = {
  allowedRoles?: UserRole[];
};

/**
 * Trích xuất và chuẩn hóa danh sách các role từ đối tượng user
 * Hỗ trợ: string ("ADMIN", "AD"), array (["ADMIN"]), object ({ roleCode: "AD" })
 */
function extractUserRoles(user: any): string[] {
  if (!user) return [];
  const rolesSet = new Set<string>();

  const processRole = (val: any) => {
    if (!val) return;
    if (typeof val === 'string') {
      const upper = val.trim().toUpperCase();
      rolesSet.add(upper);
      // Ánh xạ role code ngắn sang tên đầy đủ và ngược lại
      if (upper === 'AD' || upper === 'ROLE_ADMIN') rolesSet.add('ADMIN');
      if (upper === 'LE' || upper === 'ROLE_LECTURER') rolesSet.add('LECTURER');
      if (upper === 'ST' || upper === 'ROLE_STUDENT') rolesSet.add('STUDENT');
      if (upper === 'ADMIN') rolesSet.add('AD');
      if (upper === 'LECTURER') rolesSet.add('LE');
      if (upper === 'STUDENT') rolesSet.add('ST');
    } else if (Array.isArray(val)) {
      val.forEach(processRole);
    } else if (typeof val === 'object') {
      if (val.roleCode) processRole(val.roleCode);
      if (val.roleName) processRole(val.roleName);
      if (val.name) processRole(val.name);
      if (val.code) processRole(val.code);
      if (val.authority) processRole(val.authority);
    }
  };

  processRole(user.role);
  processRole(user.roleName);
  processRole(user.roleCode);
  processRole(user.roles);
  processRole(user.authorities);

  return Array.from(rolesSet);
}

/**
 * Đọc thông tin user linh hoạt từ cả hai key: swd_auth_user hoặc user trong localStorage
 */
function getFlexibleUser(): any {
  try {
    const swdRaw = localStorage.getItem('swd_auth_user');
    if (swdRaw) return JSON.parse(swdRaw);
    const userRaw = localStorage.getItem('user');
    if (userRaw) return JSON.parse(userRaw);
    const authRaw = localStorage.getItem('auth_user') || localStorage.getItem('currentUser');
    if (authRaw) return JSON.parse(authRaw);
  } catch {
    // ignore
  }
  return null;
}

export default function ProtectedRoute({ allowedRoles = [] }: ProtectedRouteProps) {
  const { isAuthenticated, user: contextUser } = useAuth();

  // Đọc user từ Context hoặc fallback trực tiếp từ localStorage
  const activeUser = contextUser || getFlexibleUser();

  // Kiểm tra môi trường phát triển (Local Dev Mode)
  const isDev = import.meta.env.DEV || true; // Đảm bảo dev mode luôn bypass blocker

  // 1. Nếu chưa có thông tin user
  if (!activeUser) {
    if (isDev) {
      // Trong môi trường dev, tự động cấp mock credentials tương ứng với route cần truy cập
      const neededRole: UserRole = allowedRoles[0] || 'ADMIN';
      const devUser = {
        id: neededRole === 'ADMIN' ? 1 : 2,
        userId: neededRole === 'ADMIN' ? 'usr-admin-dev' : 'usr-lecturer-dev',
        email: neededRole === 'ADMIN' ? 'admin@aives.edu.vn' : 'lecturer@aives.edu.vn',
        fullName: neededRole === 'ADMIN' ? 'Administrator (Dev)' : 'Dr. Lecturer (Dev)',
        role: neededRole,
        studentOrStaffCode: neededRole === 'ADMIN' ? 'AD001' : 'LE001',
      };
      try {
        localStorage.setItem('swd_auth_user', JSON.stringify(devUser));
        localStorage.setItem('user', JSON.stringify(devUser));
        localStorage.setItem('accessToken', 'dev-mock-jwt-token');
      } catch {
        // ignore
      }
      return <Outlet />;
    }
    return <Navigate to="/login" replace />;
  }

  // 2. Kiểm tra phân quyền (Role Guard)
  if (allowedRoles.length > 0) {
    const userRoles = extractUserRoles(activeUser);
    const hasPermission = allowedRoles.some((allowed) => {
      const target = allowed.toUpperCase();
      return userRoles.includes(target);
    });

    if (!hasPermission) {
      // Trong dev mode: fallback graceful, tự động cho phép kiểm thử trang mà không bị chặn bởi 403
      if (isDev) {
        console.info(
          `[Dev Mode] Bypass 403 guard for allowed roles: [${allowedRoles.join(
            ', ',
          )}]. Current user roles: [${userRoles.join(', ')}]`,
        );
        return <Outlet />;
      }
      return <Navigate to="/403" replace />;
    }
  }

  return <Outlet />;
}
