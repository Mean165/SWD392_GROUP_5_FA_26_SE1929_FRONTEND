import { useCallback, useEffect, useState } from 'react';
import { getExamSessionError, getExamSessions, type ExamSessionQuery } from '../api/examSessionApi';
import type { ExamSessionResponse, PageResponse } from '../types/exam';

export default function useExamSessions(query: ExamSessionQuery) {
  const [result, setResult] = useState<PageResponse<ExamSessionResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const reload = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const response = await getExamSessions(query, signal);
      if (!signal?.aborted) setResult(response);
    } catch (requestError) {
      if (!signal?.aborted) setError(getExamSessionError(requestError, 'Không thể tải danh sách kỳ thi.'));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    void reload(controller.signal);
    return () => controller.abort();
  }, [reload, retryKey]);

  return { result, loading, error, retry: () => setRetryKey((value) => value + 1), reload };
}
