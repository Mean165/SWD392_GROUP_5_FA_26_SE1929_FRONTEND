import { afterEach, describe, expect, it } from 'vitest';
import axios, { AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import apiClient from '../api/apiClient';
import {
  getInterviewErrorMessage,
  getInterviewErrorStatus,
  getTurnSpeech,
  startInterview,
} from './interviewService';

let originalAdapter: typeof apiClient.defaults.adapter;

const installAdapter = (data: unknown) => {
  const configs: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    configs.push(config);
    return {
      data,
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders({
        'content-type': data instanceof Blob ? data.type : 'application/json',
      }),
      config,
    };
  };
  apiClient.defaults.adapter = adapter;
  return configs;
};

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  localStorage.removeItem('accessToken');
});

describe('interview API client', () => {
  it('starts the assigned exam attempt ID, not an enrollment or interview ID', async () => {
    originalAdapter = apiClient.defaults.adapter;
    const configs = installAdapter({ success: true, message: 'ok', data: { attemptId: 'interview-uuid', examAttemptId: 'exam-attempt-uuid' } });
    await startInterview('exam-attempt-uuid');
    expect(configs[0].url).toBe('/interviews/start');
    expect(JSON.parse(configs[0].data as string)).toEqual({ examAttemptId: 'exam-attempt-uuid' });
  });

  it('requests TTS as authenticated Blob bytes using the backend turn URL', async () => {
    originalAdapter = apiClient.defaults.adapter;
    localStorage.setItem('accessToken', 'test-access-token');
    const audio = new Blob(['mp3 bytes'], { type: 'audio/mpeg' });
    const configs = installAdapter(audio);

    await expect(getTurnSpeech('turn-uuid')).resolves.toBe(audio);
    expect(configs[0].url).toBe('/interviews/turns/turn-uuid/speech');
    expect(configs[0].responseType).toBe('blob');
    expect(configs[0].timeout).toBe(60_000);
    expect(configs[0].headers.Authorization).toBe('Bearer test-access-token');
  });

  it('rejects non-MP3 or empty TTS responses rather than treating them as audio', async () => {
    originalAdapter = apiClient.defaults.adapter;
    installAdapter(new Blob(['not mp3'], { type: 'audio/ogg' }));
    await expect(getTurnSpeech('turn-uuid')).rejects.toThrow('định dạng âm thanh không hợp lệ');

    installAdapter(new Blob([], { type: 'audio/mpeg' }));
    await expect(getTurnSpeech('turn-uuid')).rejects.toThrow('tệp âm thanh hợp lệ');
  });

  it('accepts WAV question audio from the selected TTS provider', async () => {
    originalAdapter = apiClient.defaults.adapter;
    const audio = new Blob(['wav bytes'], { type: 'audio/wav' });
    installAdapter(audio);

    await expect(getTurnSpeech('turn-uuid')).resolves.toBe(audio);
  });

  it('maps authentication, authorization, expiry, and provider failures without exposing upstream details', () => {
    const makeAxiosError = (status: number) => Object.assign(new Error('raw upstream secret'), {
      isAxiosError: true,
      response: { status, data: { error: 'private provider details' } },
    });
    expect(getInterviewErrorMessage(makeAxiosError(401))).toContain('đăng nhập lại');
    expect(getInterviewErrorMessage(makeAxiosError(403))).toContain('không có quyền');
    expect(getInterviewErrorMessage(makeAxiosError(400))).toContain('không hợp lệ');
    expect(getInterviewErrorMessage(makeAxiosError(404))).toContain('Không tìm thấy');
    expect(getInterviewErrorMessage(makeAxiosError(410))).toContain('hết hạn');
    expect(getInterviewErrorMessage(makeAxiosError(502), 'submit')).toContain('Bản ghi vẫn được giữ');
    expect(getInterviewErrorMessage(makeAxiosError(503), 'submit')).toContain('chưa sẵn sàng');
    expect(getInterviewErrorMessage(makeAxiosError(502), 'speech')).toContain('giọng đọc câu hỏi');
    expect(getInterviewErrorMessage(makeAxiosError(502), 'submit')).not.toContain('secret');
    expect(getInterviewErrorMessage(makeAxiosError(502), 'submit')).not.toContain('private provider details');
    expect(axios.isAxiosError(makeAxiosError(400))).toBe(true);
    expect(getInterviewErrorStatus(makeAxiosError(410))).toBe(410);
    expect(getInterviewErrorMessage({ isAxiosError: true })).toContain('kiểm tra mạng');
  });
});
