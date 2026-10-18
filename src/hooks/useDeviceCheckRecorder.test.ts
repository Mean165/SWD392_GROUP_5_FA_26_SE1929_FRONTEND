import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDeviceCheckRecorder } from './useDeviceCheckRecorder';

class FakeMediaRecorder {
  static supported = new Set(['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']);
  static output = 'recorded audio';
  static instance: FakeMediaRecorder | null = null;
  static isTypeSupported(type: string) {
    return FakeMediaRecorder.supported.has(type);
  }

  readonly mimeType: string;
  state: RecordingState = 'inactive';
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
    this.mimeType = options?.mimeType ?? 'audio/webm';
    FakeMediaRecorder.instance = this;
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob([FakeMediaRecorder.output], { type: this.mimeType }) } as BlobEvent);
    this.onstop?.();
  }
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  FakeMediaRecorder.supported = new Set(['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']);
  FakeMediaRecorder.output = 'recorded audio';
  FakeMediaRecorder.instance = null;
});

const fakeStream = {
  getAudioTracks: () => [{ readyState: 'live' }],
} as unknown as MediaStream;

describe('useDeviceCheckRecorder', () => {
  it('records only backend-accepted formats, preserves the completed file, and rejects empty audio', () => {
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:local-recording'),
      revokeObjectURL: vi.fn(),
    });
    const { result, unmount } = renderHook(() => useDeviceCheckRecorder(['audio/mp4'], 5, 15));

    act(() => result.current.startRecording(fakeStream));
    expect(FakeMediaRecorder.instance?.mimeType).toBe('audio/mp4');
    expect(result.current.isRecording).toBe(true);
    act(() => result.current.stopRecording());
    expect(result.current.recordedBlob?.size).toBeGreaterThan(0);
    expect(result.current.fileName).toBe('device-check.mp4');
    expect(result.current.audioUrl).toBe('blob:local-recording');
    unmount();

    FakeMediaRecorder.output = '';
    const emptyResult = renderHook(() => useDeviceCheckRecorder(['audio/webm'], 5, 15));
    act(() => emptyResult.result.current.startRecording(fakeStream));
    act(() => emptyResult.result.current.stopRecording());
    expect(emptyResult.result.current.recordedBlob).toBeNull();
    expect(emptyResult.result.current.error).toContain('Bản ghi không có âm thanh');
    emptyResult.unmount();
  });

  it('does not start recording when no supported accepted MIME type is available', () => {
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
    FakeMediaRecorder.supported.clear();
    const { result } = renderHook(() => useDeviceCheckRecorder(['audio/flac'], 5, 15));
    act(() => result.current.startRecording(fakeStream));

    expect(result.current.isRecording).toBe(false);
    expect(result.current.recordedBlob).toBeNull();
    expect(result.current.error).toContain('không hỗ trợ định dạng');
  });

  it('automatically stops at the smaller of the recommended duration and maximum duration', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:local-recording'),
      revokeObjectURL: vi.fn(),
    });
    const { result, unmount } = renderHook(() => useDeviceCheckRecorder(['audio/webm'], 5, 2));
    act(() => result.current.startRecording(fakeStream));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });

    expect(FakeMediaRecorder.instance?.state).toBe('inactive');
    expect(result.current.isRecording).toBe(false);
    expect(result.current.durationSeconds).toBeLessThanOrEqual(2);
    expect(result.current.recordedBlob?.size).toBeGreaterThan(0);
    unmount();
  });
});
