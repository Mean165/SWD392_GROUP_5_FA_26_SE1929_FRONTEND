import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDeviceMicrophone } from './useDeviceMicrophone';

const originalMediaDevices = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');
const originalSecureContext = Object.getOwnPropertyDescriptor(window, 'isSecureContext');

class FakeAudioContext {
  static instance: FakeAudioContext | null = null;
  state: AudioContextState = 'running';
  createMediaStreamSource = vi.fn(() => ({ connect: vi.fn() }));
  createAnalyser = vi.fn(() => ({
    fftSize: 0,
    getByteTimeDomainData: (samples: Uint8Array) => samples.fill(128),
  }));
  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockImplementation(() => {
    this.state = 'closed';
    return Promise.resolve();
  });

  constructor() {
    FakeAudioContext.instance = this;
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalMediaDevices) {
    Object.defineProperty(navigator, 'mediaDevices', originalMediaDevices);
  } else {
    Reflect.deleteProperty(navigator, 'mediaDevices');
  }
  if (originalSecureContext) {
    Object.defineProperty(window, 'isSecureContext', originalSecureContext);
  } else {
    Reflect.deleteProperty(window, 'isSecureContext');
  }
  localStorage.removeItem('aiviva-device-check-input');
  FakeAudioContext.instance = null;
});

describe('useDeviceMicrophone', () => {
  it('stops the microphone track, animation frame, and audio context on unmount', async () => {
    const track = { readyState: 'live', stop: vi.fn(), addEventListener: vi.fn() };
    const stream = {
      getTracks: () => [track],
      getAudioTracks: () => [track],
    } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    const enumerateDevices = vi.fn().mockResolvedValue([{ kind: 'audioinput', deviceId: 'mic-1', label: 'Microphone' }]);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia, enumerateDevices },
    });
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    const cancelFrame = vi.fn();
    vi.stubGlobal('AudioContext', FakeAudioContext);
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 18));
    vi.stubGlobal('cancelAnimationFrame', cancelFrame);

    const { result, unmount } = renderHook(() => useDeviceMicrophone());
    await act(async () => {
      await result.current.startMicrophone();
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.devices).toHaveLength(1);
    unmount();
    expect(track.stop).toHaveBeenCalledOnce();
    expect(cancelFrame).toHaveBeenCalledWith(18);
    expect(FakeAudioContext.instance?.close).toHaveBeenCalledOnce();
  });
});
