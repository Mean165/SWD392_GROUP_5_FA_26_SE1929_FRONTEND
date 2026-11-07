import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import apiClient from '../api/apiClient';
import { getDeviceCheckError, getDeviceCheckSttHealth, getDeviceCheckTts } from './deviceCheckApi';

const originalAdapter = apiClient.defaults.adapter;
afterEach(() => { apiClient.defaults.adapter = originalAdapter; localStorage.removeItem('accessToken'); });

describe('deviceCheckApi', () => {
  it('loads direct health JSON with the bearer token', async () => {
    localStorage.setItem('accessToken', 'test-token');
    const component = { ready: true, provider: 'local' as const, engine: 'faster-whisper', model: 'local-model', device: 'cuda', reason: '', languages: ['vi-VN', 'en-US'] as const };
    const health = { stt: component, tts: { ...component, engine: 'piper' }, resources: {}, versions: {}, sampleRate: 16000, encoding: 'pcm_s16le', maxDurationSeconds: 60 } as const;
    let request: InternalAxiosRequestConfig | undefined;
    const adapter: AxiosAdapter = async (config) => {
      request = config;
      return { data: health, status: 200, statusText: 'OK', headers: {}, config };
    };
    apiClient.defaults.adapter = adapter;
    await expect(getDeviceCheckSttHealth()).resolves.toEqual(health);
    expect(request?.url).toBe('/student/device-check/stt/health');
    expect(request?.timeout).toBe(10_000);
    expect(request?.headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('requests TTS MP3 bytes using the selected language', async () => {
    const audio = new Blob(['mp3'], { type: 'audio/mpeg' });
    let request: InternalAxiosRequestConfig | undefined;
    const adapter: AxiosAdapter = async (config) => {
      request = config;
      return { data: audio, status: 200, statusText: 'OK', headers: { 'content-type': 'audio/mpeg' }, config };
    };
    apiClient.defaults.adapter = adapter;
    await expect(getDeviceCheckTts('en')).resolves.toBe(audio);
    expect(request?.url).toBe('/student/device-check/tts');
    expect(request?.params).toEqual({ language: 'en' });
    expect(request?.responseType).toBe('blob');
  });

  it('accepts local WAV audio returned by the TTS service', async () => {
    const audio = new Blob(['wav'], { type: 'audio/wav' });
    const adapter: AxiosAdapter = async (config) => ({
      data: audio,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'audio/wav' },
      config,
    });
    apiClient.defaults.adapter = adapter;

    await expect(getDeviceCheckTts('vi')).resolves.toBe(audio);
  });

  it('labels an upstream TTS failure as an audio playback error, not an STT error', () => {
    const error = Object.assign(new Error('private provider detail'), {
      isAxiosError: true,
      response: { status: 502, headers: {} },
    });

    expect(getDeviceCheckError(error, 'tts').message).toContain('âm thanh mẫu');
    expect(getDeviceCheckError(error).message).toContain('nhận diện');
  });
});
