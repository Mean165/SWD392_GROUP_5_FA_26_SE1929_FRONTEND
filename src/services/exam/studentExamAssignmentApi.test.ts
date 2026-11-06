import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import apiClient from '../api/apiClient';
import {
  getStudentExamAssignments,
  getStudentExamEligibility,
} from './studentExamAssignmentApi';

const originalAdapter = apiClient.defaults.adapter;

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});

describe('studentExamAssignmentApi', () => {
  it('loads a paged assignment response using the backend query contract', async () => {
    let requestConfig: InternalAxiosRequestConfig | undefined;
    const adapter: AxiosAdapter = async (config) => {
      requestConfig = config;
      return {
        data: {
          success: true,
          message: 'OK',
          data: {
            content: [{
              assignmentId: 'assignment-1',
              scheduledTime: '2026-10-18T10:00:00Z',
              assignmentStatus: 'SCHEDULED',
              sessionId: 'session-1',
              sessionName: 'Buổi thi',
              sessionStatus: 'SCHEDULED',
              timeLimitMinutes: 15,
              maxMainQuestions: 3,
              maxFollowupPerQuestion: 2,
              attemptId: null,
              attemptStatus: null,
            }],
            page: 0,
            size: 10,
            totalElements: 1,
            totalPages: 1,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };
    apiClient.defaults.adapter = adapter;

    const page = await getStudentExamAssignments({
      from: '2026-10-18T00:00:00+07:00',
      to: '2026-11-17T23:59:59+07:00',
      status: 'SCHEDULED',
      page: 0,
      size: 10,
    });
    expect(requestConfig?.url).toBe('/student/exam-assignments');
    expect(requestConfig?.params).toEqual({
      from: '2026-10-18T00:00:00+07:00',
      to: '2026-11-17T23:59:59+07:00',
      status: 'SCHEDULED',
      page: 0,
      size: 10,
    });
    expect(page.content[0].sessionId).toBe('session-1');
    expect(page.totalPages).toBe(1);
  });

  it('checks eligibility for the exact assignment id returned by the backend', async () => {
    let requestConfig: InternalAxiosRequestConfig | undefined;
    const adapter: AxiosAdapter = async (config) => {
      requestConfig = config;
      return {
        data: {
          success: true,
          message: 'OK',
          data: { canEnter: false, reason: 'Chưa đến giờ', opensAt: '2026-10-18T09:00:00Z', closesAt: null },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };
    apiClient.defaults.adapter = adapter;

    const result = await getStudentExamEligibility('assignment/1');
    expect(requestConfig?.url).toBe('/student/exam-assignments/assignment%2F1/eligibility');
    expect(result.canEnter).toBe(false);
    expect(result.opensAt).toBe('2026-10-18T09:00:00Z');
  });

  it('sends date-only bounds and omits the all-status filter', async () => {
    let requestConfig: InternalAxiosRequestConfig | undefined;
    const adapter: AxiosAdapter = async (config) => {
      requestConfig = config;
      return { data: { success: true, message: 'OK', data: { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 } }, status: 200, statusText: 'OK', headers: {}, config };
    };
    apiClient.defaults.adapter = adapter;
    const result = await getStudentExamAssignments({ from: '2026-11-04', to: '2026-12-04', status: 'ALL', page: 0, size: 20 });
    expect(requestConfig?.params).toEqual({ page: 0, size: 20, from: '2026-11-04', to: '2026-12-04' });
    expect(apiClient.getUri(requestConfig)).toContain('from=2026-11-04');
    expect(result.content).toEqual([]);
    expect(result.totalElements).toBe(0);
  });

  it('encodes plus signs in offset date-time query values', async () => {
    let requestConfig: InternalAxiosRequestConfig | undefined;
    const adapter: AxiosAdapter = async (config) => {
      requestConfig = config;
      return { data: { success: true, message: 'OK', data: { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 } }, status: 200, statusText: 'OK', headers: {}, config };
    };
    apiClient.defaults.adapter = adapter;
    await getStudentExamAssignments({ from: '2026-11-04T00:00:00+07:00', to: '2026-12-04T23:59:59+07:00', page: 0, size: 10 });
    expect(apiClient.getUri(requestConfig)).toContain('from=2026-11-04T00:00:00%2B07:00');
  });

  it('preserves validation and server error retry behavior', async () => {
    const makeAdapter = (status: number): AxiosAdapter => async (config) => {
      throw new AxiosError('request failed', status === 400 ? 'ERR_BAD_REQUEST' : 'ERR_BAD_RESPONSE', config, undefined, { status, statusText: 'Error', headers: {}, config, data: null });
    };
    apiClient.defaults.adapter = makeAdapter(400);
    await expect(getStudentExamAssignments({ from: 'bad-date', to: '', page: 0, size: 10 })).rejects.toMatchObject({ status: 400, retryable: false });
    apiClient.defaults.adapter = makeAdapter(500);
    await expect(getStudentExamAssignments({ from: '', to: '', page: 0, size: 10 })).rejects.toMatchObject({ status: 500, retryable: true });
  });
});
