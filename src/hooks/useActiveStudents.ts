import { useCallback, useEffect, useState } from 'react';
import { getAdminUsers } from '../services/user/userService';
import { getExamSessionError, MOCK_ACTIVE_STUDENTS } from '../api/examSessionApi';
import type { AdminUser, PageResponse } from '../types/user';

export default function useActiveStudents(keyword: string) {
  const [students, setStudents] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const reload = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError('');
    try {
      if (import.meta.env.VITE_USE_MOCK_EXAMS === 'true') {
        const match = keyword.trim().toLocaleLowerCase();
        const results = MOCK_ACTIVE_STUDENTS.filter((student) => !match || `${student.fullName} ${student.email} ${student.studentOrStaffCode}`.toLocaleLowerCase().includes(match));
        if (!signal?.aborted) setStudents(results.map((student) => ({ ...student, isActive: true, roleName: 'Student', createdAt: null, role: { roleId: 'sample-role-st', roleCode: 'ST', roleName: 'Student', description: null, createdAt: null } })));
        return;
      }
      const page: PageResponse<AdminUser> = await getAdminUsers({ page: 0, size: 100, roleCode: 'ST', isActive: true, keyword: keyword.trim() || undefined });
      if (!signal?.aborted) setStudents(page.content);
    } catch (requestError) {
      if (!signal?.aborted) setError(getExamSessionError(requestError, 'Không thể tải danh sách sinh viên.'));
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [keyword]);

  useEffect(() => {
    const controller = new AbortController();
    void reload(controller.signal);
    return () => controller.abort();
  }, [reload, retryKey]);

  return { students, loading, error, retry: () => setRetryKey((value) => value + 1) };
}
