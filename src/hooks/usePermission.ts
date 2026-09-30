import { useMemo } from 'react';
import { ROLES, type UserRole } from '../constants/roles';
import { useAuth } from './useAuth';

export const usePermission = () => {
  const { user } = useAuth();

  const hasRole = useMemo(
    () => (requiredRole: UserRole | UserRole[]) => {
      if (!user) return false;

      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      return roles.includes(user.role as UserRole);
    },
    [user],
  );

  const canAccessAdmin = useMemo(() => hasRole(ROLES.ADMIN), [hasRole]);
  const canAccessLecturer = useMemo(() => hasRole(ROLES.LECTURER), [hasRole]);
  const canAccessStudent = useMemo(() => hasRole(ROLES.STUDENT), [hasRole]);

  return {
    hasRole,
    canAccessAdmin,
    canAccessLecturer,
    canAccessStudent,
  };
};
