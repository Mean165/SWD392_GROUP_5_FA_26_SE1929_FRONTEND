import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { createSubjectRubric, deleteSubjectRubric, getRubricApiError, getSubjectRubric, getSubjectRubricStats, updateSubjectRubric } from '../api/rubricApi';
import type { SubjectRubric, SubjectRubricInput, SubjectRubricStats } from '../types/rubric';

export default function useRubrics(subjectId: string) {
  const [rubric, setRubric] = useState<SubjectRubric | null>(null);
  const [stats, setStats] = useState<SubjectRubricStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current;
    if (!subjectId) { setRubric(null); setStats(null); setLoading(false); setError(''); return; }
    setLoading(true); setError('');
    const [rubricResult, statsResult] = await Promise.allSettled([getSubjectRubric(subjectId), getSubjectRubricStats(subjectId)]);
    if (currentRequest !== requestId.current) return;
    if (rubricResult.status === 'fulfilled') setRubric(rubricResult.value);
    else if (axios.isAxiosError(rubricResult.reason) && rubricResult.reason.response?.status === 404) setRubric(null);
    else setError('rubric');
    if (statsResult.status === 'fulfilled') setStats(statsResult.value);
    else setError((current) => current || 'stats');
    setLoading(false);
  }, [subjectId]);

  useEffect(() => { void refresh(); }, [refresh, retryKey]);
  const create = useCallback(async (payload: SubjectRubricInput) => {
    try { const saved = await createSubjectRubric(subjectId, payload); setRubric(saved); await refresh(); return saved; }
    catch (requestError) { throw getRubricApiError(requestError); }
  }, [refresh, subjectId]);
  const update = useCallback(async (payload: SubjectRubricInput) => {
    try { const saved = await updateSubjectRubric(subjectId, payload); setRubric(saved); await refresh(); return saved; }
    catch (requestError) { throw getRubricApiError(requestError); }
  }, [refresh, subjectId]);
  const archive = useCallback(async () => {
    try { await deleteSubjectRubric(subjectId); await refresh(); }
    catch (requestError) { throw getRubricApiError(requestError); }
  }, [refresh, subjectId]);
  return { rubric, stats, loading, error, refresh, retry: () => setRetryKey((key) => key + 1), create, update, archive };
}
