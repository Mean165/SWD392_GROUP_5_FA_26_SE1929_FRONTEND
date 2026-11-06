import { useEffect, useState } from 'react';
import { getRubricApiError, getRubricSubjects, getRubricTopics } from '../api/rubricApi';
import type { SubjectOption, TopicOption } from '../types/question';

export default function useRubricTopics() {
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [error, setError] = useState('');
  const [topicsError, setTopicsError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    getRubricSubjects(controller.signal)
      .then((items) => { if (!controller.signal.aborted) setSubjects(items); })
      .catch((requestError) => { if (!controller.signal.aborted) setError(getRubricApiError(requestError, 'Không thể tải danh mục môn học.').message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retryKey]);

  useEffect(() => {
    if (!subjectId) {
      setTopics([]);
      setTopicsError('');
      setTopicsLoading(false);
      return undefined;
    }
    const controller = new AbortController();
    setTopicsLoading(true);
    setTopicsError('');
    getRubricTopics(subjectId, controller.signal)
      .then((items) => { if (!controller.signal.aborted) setTopics(items); })
      .catch((requestError) => { if (!controller.signal.aborted) setTopicsError(getRubricApiError(requestError, 'Không thể tải danh mục chủ đề.').message); })
      .finally(() => { if (!controller.signal.aborted) setTopicsLoading(false); });
    return () => controller.abort();
  }, [subjectId, retryKey]);

  return {
    subjects,
    topics,
    subjectId,
    setSubjectId,
    loading,
    topicsLoading,
    error,
    topicsError,
    retry: () => setRetryKey((key) => key + 1),
  };
}
