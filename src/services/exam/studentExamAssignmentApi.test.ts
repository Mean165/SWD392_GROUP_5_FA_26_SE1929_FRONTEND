import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
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
      from: '2026-10-18',
      to: '2026-11-17',
      status: 'SCHEDULED',
      page: 0,
      size: 10,
    });
    expect(requestConfig?.url).toBe('/student/exam-assignments');
    expect(requestConfig?.params).toEqual({
      from: '2026-10-18',
      to: '2026-11-17',
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
});
