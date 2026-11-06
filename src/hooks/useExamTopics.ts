import { useEffect, useState } from 'react';
import { getExamSessionError, getExamTopics, type ExamTopicOption } from '../api/examSessionApi';

export default function useExamTopics() {
  const [topics, setTopics] = useState<ExamTopicOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    getExamTopics(controller.signal)
      .then((items) => { if (!controller.signal.aborted) setTopics(items); })
      .catch((requestError) => { if (!controller.signal.aborted) setError(getExamSessionError(requestError, 'Không thể tải danh mục môn học.')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retryKey]);
  return { topics, loading, error, retry: () => setRetryKey((value) => value + 1) };
}
