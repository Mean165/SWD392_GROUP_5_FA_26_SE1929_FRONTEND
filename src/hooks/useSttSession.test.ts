import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSttSession } from './useSttSession';

let activeSocket: MockSocket | null = null;

class MockSocket {
  static OPEN = 1;
  static CLOSING = 2;
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  send = vi.fn();
  close = vi.fn(() => { this.readyState = 3; });

  constructor() { activeSocket = this; }
}

class MockAudioContext {
  state = 'running';
  sampleRate = 48_000;
  destination = {};
  get audioWorklet() { return { addModule: vi.fn().mockResolvedValue(undefined) }; }
  createMediaStreamSource() { return { connect: vi.fn(), disconnect: vi.fn() }; }
  createAnalyser() { return { fftSize: 0, getByteTimeDomainData: (data: Uint8Array) => data.fill(128) }; }
  createGain() { return { gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() }; }
  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
}

class MockAudioWorkletNode {
  port = { onmessage: null, close: vi.fn() };
  connect = vi.fn();
  disconnect = vi.fn();
  constructor(_context: unknown, _name: string) {}
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  activeSocket = null;
});

describe('useSttSession stop fallback', () => {
  it('refreshes the attempt after the server misses its ended acknowledgement', async () => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: MockAudioContext });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
        getAudioTracks: () => [{ stop: vi.fn(), addEventListener: vi.fn() }],
      }) },
    });
    vi.stubGlobal('AudioContext', MockAudioContext);
    vi.stubGlobal('AudioWorkletNode', MockAudioWorkletNode);
    vi.stubGlobal('WebSocket', MockSocket);
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:test') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });

    const onEnded = vi.fn();
    const { result } = renderHook(() => useSttSession({
      language: 'vi-VN', purpose: 'EXAM', attemptId: 'attempt-1', turnId: 'turn-1', onEnded,
    }));

    await act(async () => { await result.current.start('token'); });
    expect(activeSocket).not.toBeNull();
    act(() => {
      activeSocket!.readyState = MockSocket.OPEN;
      activeSocket!.onopen?.();
    });
    act(() => result.current.stop());
    expect(result.current.state).toBe('stopping');

    await act(async () => { await vi.advanceTimersByTimeAsync(3_000); });
    expect(result.current.state).toBe('ended');
    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(onEnded).toHaveBeenCalledWith('');
  });
});
