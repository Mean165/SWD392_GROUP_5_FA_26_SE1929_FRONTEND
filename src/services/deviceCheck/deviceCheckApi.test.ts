import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import apiClient from '../api/apiClient';
import {
  getDeviceCheckError,
  getDeviceCheckTts,
  postDeviceCheckStt,
} from './deviceCheckApi';

const originalAdapter = apiClient.defaults.adapter;

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  localStorage.removeItem('accessToken');
});

describe('deviceCheckApi', () => {
  it('requests TTS bytes from the configured endpoint with language and the current bearer token', async () => {
    localStorage.setItem('accessToken', 'test-access-token');
    const audio = new Blob(['mp3'], { type: 'audio/mpeg' });
    let requestConfig: InternalAxiosRequestConfig | undefined;
    const adapter: AxiosAdapter = async (config) => {
      requestConfig = config;
      return {
        data: audio,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'audio/mpeg' },
        config,
      };
    };
    apiClient.defaults.adapter = adapter;

    await expect(getDeviceCheckTts('vi')).resolves.toBe(audio);
    expect(requestConfig?.url).toBe('/student/device-check/tts');
    expect(requestConfig?.params).toEqual({ language: 'vi' });
    expect(requestConfig?.responseType).toBe('blob');
    expect(requestConfig?.headers.get('Authorization')).toBe('Bearer test-access-token');
  });

  it('sends a completed audio File as multipart fields and not JSON', async () => {
    const file = new File(['recording'], 'device-check.webm', { type: 'audio/webm' });
    let requestConfig: InternalAxiosRequestConfig | undefined;
    const adapter: AxiosAdapter = async (config) => {
      requestConfig = config;
      return {
        data: {
          success: true,
          message: 'OK',
          data: {
            transcript: 'Câu phiên âm từ máy chủ',
            matchScore: 0.9,
            level: 'GOOD',
            durationMs: 5000,
            language: 'vi',
            suggestion: 'Tốt',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };
    apiClient.defaults.adapter = adapter;

    const result = await postDeviceCheckStt(file, 'vi');
    const body = requestConfig?.data as FormData;
    expect(requestConfig?.url).toBe('/student/device-check/stt');
    expect(body.get('language')).toBe('vi');
    expect((body.get('file') as File).name).toBe('device-check.webm');
    expect(requestConfig?.headers.get('Content-Type')).not.toBe('application/json');
    expect(result.transcript).toBe('Câu phiên âm từ máy chủ');
  });

  it('translates rate limits, permission failures, and internal errors to safe messages', () => {
    const rateLimited = Object.assign(new Error('private upstream details'), {
      isAxiosError: true,
      response: { status: 429, headers: { 'retry-after': '30' } },
    });
    const forbidden = Object.assign(new Error('raw server message'), {
      isAxiosError: true,
      response: { status: 403, headers: {} },
    });
    const providerFailure = Object.assign(new Error('OpenAI key leaked here'), {
      isAxiosError: true,
      response: { status: 502, headers: {} },
    });

    expect(getDeviceCheckError(rateLimited).retryAfterSeconds).toBe(30);
    expect(getDeviceCheckError(forbidden).message).toContain('không có quyền');
    expect(getDeviceCheckError(providerFailure).message).not.toContain('OpenAI');
    expect(getDeviceCheckError(Object.assign(new Error(), {
      isAxiosError: true,
      response: { status: 401, headers: {} },
    })).message).toContain('đăng nhập lại');
    expect(getDeviceCheckError(Object.assign(new Error(), {
      isAxiosError: true,
      response: { status: 413, headers: {} },
    })).message).toContain('quá lớn');
    expect(getDeviceCheckError(Object.assign(new Error(), {
      isAxiosError: true,
      response: { status: 415, headers: {} },
    })).message).toContain('không được hỗ trợ');
    expect(getDeviceCheckError(Object.assign(new Error(), {
      isAxiosError: true,
      response: { status: 503, headers: {} },
    })).message).toContain('chưa sẵn sàng');
  });
});
