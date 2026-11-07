import type { AxiosAdapter } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import apiClient from '../services/api/apiClient';
import { getExamSessions, getExamAttemptSettings, updateExamAttemptSettings, grantStudentAttempts, allocateStudentAttempt, updateStudentSchedule, voidExamAttempt } from './examSessionApi';

const originalAdapter = apiClient.defaults.adapter;

afterEach(() => { apiClient.defaults.adapter = originalAdapter; });

describe('examSessionApi Swagger compatibility', () => {
  it('uses real attempt endpoints and carries settings version and required reasons', async () => {
    const requests: Array<{ url?: string; method?: string; data?: unknown }> = [];
    const settings = { maxAttempts: 2, scorePolicy: 'HIGHEST', avoidRepeatQuestions: true, cooldownMinutes: 0, attemptWindowStart: null, attemptWindowEnd: null, countOnStartEvent: 'FIRST_QUESTION_ASKED', allowLecturerExtraAttempts: true, countAbandoned: true, countExpired: false, affectedStudents: [], version: 3 };
    apiClient.defaults.adapter = async (config) => {
      requests.push({ url: config.url, method: config.method, data: config.data ? JSON.parse(config.data as string) : undefined });
      return { data: { success: true, message: 'ok', data: settings, timestamp: 'now' }, status: 200, statusText: 'OK', headers: {}, config };
    };
    await expect(getExamAttemptSettings('exam-1')).resolves.toEqual(settings);
    await updateExamAttemptSettings('exam-1', settings);
    await grantStudentAttempts('exam-1', 'student-1', 1, 'Verified outage');
    await allocateStudentAttempt('exam-1', 'student-1', '2026-11-10T09:00:00+07:00');
    await voidExamAttempt('attempt-1', 'Duplicate record');
    expect(requests[0].url).toBe('/exam-sessions/exam-1/attempt-settings');
    expect(requests[1].data).toMatchObject({ version: 3, maxAttempts: 2 });
    expect(requests[1].data).not.toHaveProperty('affectedStudents');
    expect(requests[2]).toMatchObject({ url: '/exam-sessions/exam-1/students/student-1/grant-attempts', method: 'post', data: { additional: 1, reason: 'Verified outage' } });
    expect(requests[3]).toMatchObject({ url: '/exam-sessions/exam-1/students/student-1/attempts', method: 'post', data: { scheduledTime: '2026-11-10T09:00:00+07:00' } });
    expect(requests[4]).toMatchObject({ url: '/exam-attempts/attempt-1/void', method: 'post', data: { reason: 'Duplicate record' } });
  });

  it('accepts the current Swagger list response and derives visible student counts', async () => {
    const calls: string[] = [];
    const adapter: AxiosAdapter = async (config) => {
      calls.push(String(config.url));
      const data = config.url === '/exam-sessions'
        ? { success: true, message: 'OK', data: [{ sessionId: 'session-1', createdByName: 'Lecturer', topicId: 'topic-1', topicName: 'Topic', sessionName: 'Oral', maxMainQuestions: 3, maxFollowupPerQuestion: 2, timeLimitMinutes: 15, status: 'SCHEDULED', startTime: null, createdAt: '' }] }
        : { success: true, message: 'OK', data: [
          { assignmentId: 'a-1', sessionId: 'session-1', sessionName: 'Oral', studentId: 's-1', studentCode: 'ST1', studentName: 'A', studentEmail: 'a@example.test', scheduledTime: null, status: 'COMPLETED' },
          { assignmentId: 'a-2', sessionId: 'session-1', sessionName: 'Oral', studentId: 's-2', studentCode: 'ST2', studentName: 'B', studentEmail: 'b@example.test', scheduledTime: null, status: 'ABSENT' },
        ] };
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    };
    apiClient.defaults.adapter = adapter;

    const result = await getExamSessions({ status: 'SCHEDULED', page: 0, size: 10 });
    expect(calls).toEqual(['/exam-sessions', '/exam-sessions/session-1/students']);
    expect(result).toMatchObject({ totalElements: 1, content: [{ statistics: { studentCount: 2, completedCount: 1, absentCount: 1 } }] });
  });

  it('updates the hidden first schedule slot for an already allocated student', async () => {
    let request: { url?: string; method?: string; data?: unknown } = {};
    apiClient.defaults.adapter = async (config) => {
      request = { url: config.url, method: config.method, data: JSON.parse(config.data as string) };
      return { data: { success: true, message: 'ok', data: { assignmentId: 'assignment-1' } }, status: 200, statusText: 'OK', headers: {}, config };
    };

    await updateStudentSchedule('session-1', 'student-1', '2026-11-10T09:00:00+07:00');
    expect(request).toEqual({
      url: '/exam-sessions/session-1/students/student-1/schedule',
      method: 'put',
      data: { scheduledTime: '2026-11-10T09:00:00+07:00', attemptNo: 1 },
    });
  });
});
