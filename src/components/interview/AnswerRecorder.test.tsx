import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AnswerRecorder from './AnswerRecorder';

class FakeMediaRecorder {
  static supportedMimeTypes: string[] = ['audio/mp4'];
  static instances: FakeMediaRecorder[] = [];
  static isTypeSupported = vi.fn((mimeType: string) => FakeMediaRecorder.supportedMimeTypes.includes(mimeType));
  state: RecordingState = 'inactive';
  mimeType: string;
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  emitAudio = true;

  constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
    this.mimeType = options?.mimeType ?? '';
    FakeMediaRecorder.instances.push(this);
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    if (this.emitAudio) {
      this.ondataavailable?.({ data: new Blob(['recorded answer'], { type: this.mimeType }) } as BlobEvent);
    }
    this.onstop?.();
  }
}

const baseProps = {
  recordingAvailable: false,
  isSubmitting: false,
  submitError: null,
  onRecordingReady: vi.fn(),
  onSubmit: vi.fn(),
  onDiscard: vi.fn(),
};

let stopTrack: ReturnType<typeof vi.fn>;
let getUserMedia: ReturnType<typeof vi.fn>;

beforeEach(() => {
  FakeMediaRecorder.supportedMimeTypes = ['audio/mp4'];
  FakeMediaRecorder.instances = [];
  FakeMediaRecorder.isTypeSupported.mockClear();
  stopTrack = vi.fn();
  getUserMedia = vi.fn().mockResolvedValue({
    getTracks: () => [{ stop: stopTrack }],
  });
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  });
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AnswerRecorder', () => {
  it('asks for microphone permission on user action and uses a supported backend MIME type', async () => {
    render(<AnswerRecorder {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu ghi âm' }));
    await waitFor(() => expect(FakeMediaRecorder.instances).toHaveLength(1));
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(FakeMediaRecorder.instances[0].mimeType).toBe('audio/mp4');
    expect(FakeMediaRecorder.instances[0].state).toBe('recording');
  });

  it('prevents concurrent microphone permission requests and recorders', async () => {
    let resolveStream: (stream: MediaStream) => void = () => undefined;
    getUserMedia.mockImplementationOnce(() => new Promise((resolve) => {
      resolveStream = resolve;
    }));
    render(<AnswerRecorder {...baseProps} />);
    const startButton = screen.getByRole('button', { name: 'Bắt đầu ghi âm' });
    fireEvent.click(startButton);
    fireEvent.click(startButton);
    expect(getUserMedia).toHaveBeenCalledOnce();

    resolveStream({ getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream);
    await waitFor(() => expect(FakeMediaRecorder.instances).toHaveLength(1));
    expect(screen.getByRole('button', { name: 'Dừng ghi âm' })).toBeInTheDocument();
  });

  it('converts a completed recording to a data URL and releases microphone tracks', async () => {
    const onRecordingReady = vi.fn();
    render(<AnswerRecorder {...baseProps} onRecordingReady={onRecordingReady} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu ghi âm' }));
    await waitFor(() => expect(FakeMediaRecorder.instances).toHaveLength(1));
    fireEvent.click(screen.getByRole('button', { name: 'Dừng ghi âm' }));

    await waitFor(() => expect(onRecordingReady).toHaveBeenCalledWith(expect.stringMatching(/^data:audio\/mp4;base64,/)));
    expect(stopTrack).toHaveBeenCalledOnce();
  });

  it('does not provide an empty recording for submission', async () => {
    const onRecordingReady = vi.fn();
    render(<AnswerRecorder {...baseProps} onRecordingReady={onRecordingReady} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu ghi âm' }));
    await waitFor(() => expect(FakeMediaRecorder.instances).toHaveLength(1));
    FakeMediaRecorder.instances[0].emitAudio = false;
    fireEvent.click(screen.getByRole('button', { name: 'Dừng ghi âm' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Bản ghi trống');
    expect(onRecordingReady).not.toHaveBeenCalled();
    expect(stopTrack).toHaveBeenCalledOnce();
  });

  it('reports denied microphone permission and frees tracks on unmount', async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'));
    const { unmount } = render(<AnswerRecorder {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu ghi âm' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('chưa cấp quyền micro');

    getUserMedia.mockResolvedValueOnce({ getTracks: () => [{ stop: stopTrack }] });
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu ghi âm' }));
    await waitFor(() => expect(FakeMediaRecorder.instances).toHaveLength(1));
    unmount();
    expect(stopTrack).toHaveBeenCalledOnce();
  });

  it('does not request a microphone if no accepted recorder format is supported', async () => {
    FakeMediaRecorder.supportedMimeTypes = [];
    render(<AnswerRecorder {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu ghi âm' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('không hỗ trợ định dạng âm thanh');
    expect(getUserMedia).not.toHaveBeenCalled();
  });
});
