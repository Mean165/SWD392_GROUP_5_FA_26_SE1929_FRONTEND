export const ROLES = {
  ADMIN: 'ADMIN',
  LECTURER: 'LECTURER',
  STUDENT: 'STUDENT',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
