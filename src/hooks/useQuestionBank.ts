import { useCallback, useEffect, useState } from 'react';
import {
  getQuestionApiError,
  getQuestionBank,
  getQuestionRubric,
  updateQuestionRubricOverride,
  type QuestionBankQuery,
} from '../api/questionApi';
import type { QuestionBankItem, QuestionRubricOverrideRequest, QuestionRubricResponse } from '../types/question';

export default function useQuestionBank(query: QuestionBankQuery, canWrite = true) {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setQuestions(await getQuestionBank(query));
    } catch (requestError) {
      setError(getQuestionApiError(requestError, 'Không thể tải ngân hàng câu hỏi.'));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { void refresh(); }, [refresh, retryKey]);

  const loadRubric = useCallback(async (questionId: string): Promise<QuestionRubricResponse> => {
    try {
      return await getQuestionRubric(questionId);
    } catch (requestError) {
      throw new Error(getQuestionApiError(requestError, 'Không thể tải rubric câu hỏi.'));
    }
  }, []);

  const saveOverride = useCallback(async (questionId: string, payload: QuestionRubricOverrideRequest) => {
    if (!canWrite) throw new Error('Sinh viên chỉ được xem dữ liệu, không được ghi rubric.');
    try {
      const response = await updateQuestionRubricOverride(questionId, payload);
      await refresh();
      return response;
    } catch (requestError) {
      throw new Error(getQuestionApiError(requestError, 'Không thể lưu rubric ghi đè.'));
    }
  }, [canWrite, refresh]);

  return {
    questions,
    loading,
    error,
    retry: () => setRetryKey((key) => key + 1),
    refresh,
    loadRubric,
    saveOverride,
  };
}
