import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import apiClient from '../services/api/apiClient';
import { claimGradingSubmission, enqueueGradingAiRun, getGradingQueue, getGradingSubmission, renewGradingLock, saveGradingScores } from './gradingApi';

const originalAdapter = apiClient.defaults.adapter;
afterEach(() => { apiClient.defaults.adapter = originalAdapter; });

describe('gradingApi', () => {
  it('loads and normalizes real grading queue entries', async () => {
    let request: InternalAxiosRequestConfig | undefined;
    const adapter: AxiosAdapter = async (config) => {
      request = config;
      return {
        data: { success: true, message: 'ok', data: { page: 0, size: 20, total: 1, items: [{
          submission_id: 'submission-1', exam_id: 'exam-1', exam_name: 'Oral exam', student_id: 'student-1',
          student_name: 'Student One', attempt_no: 1, status: 'IN_REVIEW', ai_status: 'DONE',
          priority_score: 4, session_finished_at: '2026-11-05T10:00:00Z', ai_scored_at: null, finalized_at: null,
          lecturer_total_score: '7.35', version: 2,
        }] } },
        status: 200, statusText: 'OK', headers: {}, config,
      };
    };
    apiClient.defaults.adapter = adapter;

    const result = await getGradingQueue({ status: 'IN_REVIEW', page: 0, size: 20 });
    expect(request?.url).toBe('/v1/grading/queue');
    expect(request?.params).toEqual({ status: 'IN_REVIEW', page: 0, size: 20 });
    expect(result.items[0]).toMatchObject({ submissionId: 'submission-1', examName: 'Oral exam', studentName: 'Student One', status: 'IN_REVIEW', lecturerTotalScore: 7.35 });
  });

  it('loads the submitted turns for a grading item', async () => {
    let request: InternalAxiosRequestConfig | undefined;
    apiClient.defaults.adapter = async (config) => {
      request = config;
      return {
        data: { success: true, message: 'ok', data: {
          submission_id: 'submission-1', exam_id: 'exam-1', student_id: 'student-1', status: 'IN_REVIEW',
          rubric_snapshot: null,
          subjectRubricCriteria: [{ criterion_id: 'criterion-1', criteria_name: 'Correctness', expected_knowledge_points: 'Key concepts', weight_ratio: 0.6 }],
          lecturerScores: [{ question_id: 'question-1', criterion_id: 'criterion-1', score: 3, max_score: 6, source: 'MANUAL' }],
          turns: [{ turn_id: 'turn-1', turn_order: 1, turn_type: 'MAIN', main_question_id: 'question-1', bloom_level: 'REMEMBER', ai_question_text: 'Question', transcript_text: 'Answer' }],
          aiSuggestions: [],
          question_max_scores: '{"question-1":7}',
        } },
        status: 200, statusText: 'OK', headers: {}, config,
      };
    };

    const result = await getGradingSubmission('submission-1');
    expect(request?.url).toBe('/v1/grading/submissions/submission-1');
    expect(result.turns[0]).toMatchObject({ turnId: 'turn-1', questionText: 'Question', transcriptText: 'Answer' });
    expect(result.turns[0].bloomLevel).toBe('REMEMBER');
    expect(result.rubricCriteria[0]).toMatchObject({ criterionId: 'criterion-1', name: 'Correctness', weight: 0.6 });
    expect(result.lecturerScores[0]).toMatchObject({ questionId: 'question-1', criterionId: 'criterion-1', score: 3, maxScore: 6 });
    expect(result.questionMaxScores).toEqual({ 'question-1': 7 });
  });

  it('falls back to criterion ids in the immutable snapshot when active criteria are incomplete', async () => {
    apiClient.defaults.adapter = async (config) => ({
      data: { success: true, message: 'ok', data: {
        submission_id: 'submission-1',
        subjectRubricCriteria: [{ criteria_name: 'Incomplete active criterion', weight_ratio: 1 }],
        rubric_snapshot: JSON.stringify({ criteria: [
          { criterionId: 'snapshot-criterion-1', name: 'Correctness', weight: 0.6 },
          { criterionId: 'snapshot-criterion-2', name: 'Evidence', weight: 0.4 },
        ] }),
        turns: [],
        aiSuggestions: [],
      } },
      status: 200, statusText: 'OK', headers: {}, config,
    });

    const result = await getGradingSubmission('submission-1');

    expect(result.rubricCriteria.map(({ criterionId }) => criterionId)).toEqual([
      'snapshot-criterion-1',
      'snapshot-criterion-2',
    ]);
  });

  it('claims submissions and saves lecturer scores through the grading endpoints', async () => {
    const requests: Array<{ url?: string; method?: string; data?: unknown }> = [];
    apiClient.defaults.adapter = async (config) => {
      requests.push({ url: config.url, method: config.method, data: config.data ? JSON.parse(config.data as string) : undefined });
      return { data: { success: true, message: 'ok', data: {} }, status: 200, statusText: 'OK', headers: {}, config };
    };
    await claimGradingSubmission('submission-1');
    await renewGradingLock('submission-1');
    await enqueueGradingAiRun('submission-1');
    await saveGradingScores('submission-1', 4, [{ questionId: 'question-1', criterionId: 'criterion-1', score: 4, maxScore: 6, source: 'MANUAL', overrideReason: null, comment: null }], ['question-2']);
    expect(requests[0]).toMatchObject({ url: '/v1/grading/submissions/submission-1/claim', method: 'post' });
    expect(requests[1]).toMatchObject({ url: '/v1/grading/submissions/submission-1/lock', method: 'put' });
    expect(requests[2]).toMatchObject({ url: '/v1/grading/submissions/submission-1/ai-runs', method: 'post' });
    expect(requests[3]).toMatchObject({ url: '/v1/grading/submissions/submission-1/scores', method: 'put', data: { version: 4, useAiQuestionIds: ['question-2'], scores: [{ questionId: 'question-1', criterionId: 'criterion-1', score: 4, maxScore: 6, source: 'MANUAL', overrideReason: null, comment: null }] } });
  });
});
