import { describe, expect, it } from 'vitest';
import { canReconnectStt, floatToPcm16, getSttErrorMessage, makeSttSocketUrl, makeSttStartMessage } from './pcm';

describe('PCM and STT protocol helpers', () => {
  it('converts floats into signed little-endian PCM16 with clipping', () => {
    const bytes = new DataView(floatToPcm16(new Float32Array([-1, -0.5, 0, 0.5, 1, 2])));
    expect([...Array(6)].map((_, i) => bytes.getInt16(i * 2, true))).toEqual([-32768, -16384, 0, 16383, 32767, 32767]);
  });

  it('caps binary frames at 24,000 even bytes', () => {
    const frame = floatToPcm16(new Float32Array(20_000));
    expect(frame.byteLength).toBe(24_000);
    expect(frame.byteLength % 2).toBe(0);
  });

  it('URL-encodes the token and uses the configured local WebSocket route', () => {
    expect(makeSttSocketUrl('a+b&c', { protocol: 'http:', host: 'localhost:5173' } as Location))
      .toBe('ws://localhost:5173/ws/stt?access_token=a%2Bb%26c');
  });

  it('uses the configured secure backend host outside a same-origin deployment', () => {
    expect(makeSttSocketUrl('token', { protocol: 'https:', host: 'app.example.test' } as Location, 'https://api.example.test/api'))
      .toBe('wss://api.example.test/ws/stt?access_token=token');
  });

  it('maps backend codes to safe user messages', () => {
    expect(getSttErrorMessage('RATE_LIMITED')).toContain('đóng tab');
    expect(getSttErrorMessage('PROVIDER_UNAVAILABLE')).not.toContain('Google');
  });

  it('builds exact device-check and exam start payloads and caps reconnects at one', () => {
    expect(makeSttStartMessage('vi-VN', 'DEVICE_CHECK')).toEqual({ type: 'start', language: 'vi-VN', purpose: 'DEVICE_CHECK', sampleRate: 16000, encoding: 'pcm_s16le', consent: true });
    expect(makeSttStartMessage('en-US', 'EXAM', { attemptId: 'attempt', turnId: 'turn' })).toEqual({ type: 'start', language: 'en-US', purpose: 'EXAM', sampleRate: 16000, encoding: 'pcm_s16le', consent: true, attemptId: 'attempt', turnId: 'turn' });
    expect(canReconnectStt(false, 0, true)).toBe(false);
    expect(canReconnectStt(true, 0, true)).toBe(true);
    expect(canReconnectStt(true, 1, true)).toBe(false);
    expect(canReconnectStt(true, 0, false)).toBe(false);
  });
});
