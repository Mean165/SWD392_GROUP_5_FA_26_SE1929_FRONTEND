import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../context/LanguageContext';
import DeviceCheckPage from './DeviceCheckPage';

const deviceCheckMocks = vi.hoisted(() => ({
  getConfig: vi.fn(),
  getTts: vi.fn(),
  postStt: vi.fn(),
  getError: vi.fn((error: unknown) => error instanceof Error ? error : new Error('Lỗi kiểm tra')),
  useRecorder: vi.fn(),
}));
const originalSpeechSynthesis = Object.getOwnPropertyDescriptor(window, 'speechSynthesis');
const originalCreateObjectUrl = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
const originalRevokeObjectUrl = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');

vi.mock('../../services/deviceCheck/deviceCheckApi', () => ({
  getDeviceCheckConfig: deviceCheckMocks.getConfig,
  getDeviceCheckTts: deviceCheckMocks.getTts,
  postDeviceCheckStt: deviceCheckMocks.postStt,
  getDeviceCheckError: deviceCheckMocks.getError,
}));

vi.mock('../../hooks/useDeviceMicrophone', () => ({
  useDeviceMicrophone: () => ({
    devices: [],
    selectedDeviceId: '',
    selectDevice: vi.fn(),
    isActive: false,
    stream: null,
    level: 0,
    hasSignal: false,
    error: null,
    startMicrophone: vi.fn(),
    stopMicrophone: vi.fn(),
  }),
}));

vi.mock('../../hooks/useDeviceCheckRecorder', () => ({
  useDeviceCheckRecorder: deviceCheckMocks.useRecorder,
}));

const config = {
  languages: ['vi', 'en'],
  defaultLanguage: 'vi',
  acceptedMimeTypes: ['audio/webm', 'audio/mp4'],
  maxAudioBytes: 2 * 1024 * 1024,
  maxDurationSeconds: 15,
  recommendedRecordingSeconds: 5,
  sampleSentences: { vi: 'Tôi đang kiểm tra micro.', en: 'I am checking my microphone.' },
};

const renderPage = () => render(
  <LanguageProvider>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <DeviceCheckPage />
    </MemoryRouter>
  </LanguageProvider>,
);

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  if (originalSpeechSynthesis) {
    Object.defineProperty(window, 'speechSynthesis', originalSpeechSynthesis);
  } else {
    Reflect.deleteProperty(window, 'speechSynthesis');
  }
  if (originalCreateObjectUrl) Object.defineProperty(URL, 'createObjectURL', originalCreateObjectUrl);
  else Reflect.deleteProperty(URL, 'createObjectURL');
  if (originalRevokeObjectUrl) Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectUrl);
  else Reflect.deleteProperty(URL, 'revokeObjectURL');
  sessionStorage.clear();
});

describe('DeviceCheckPage', () => {
  it('reports backend TTS errors instead of faking playback or falling back to speech synthesis', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    deviceCheckMocks.getConfig.mockResolvedValue(config);
    deviceCheckMocks.getTts.mockRejectedValue(new Error('Không lấy được audio từ máy chủ.'));
    deviceCheckMocks.useRecorder.mockReturnValue({
      isRecording: false,
      recordedBlob: null,
      recordedMimeType: '',
      durationSeconds: 0,
      error: null,
      audioUrl: null,
      fileName: '',
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      clearRecording: vi.fn(),
    });
    const speak = vi.fn();
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { speak } });
    const { unmount } = renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /loa/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Phát âm thanh thử' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Không lấy được audio từ máy chủ.');
    expect(speak).not.toHaveBeenCalled();
  });

  it('disables submit while processing and displays the final transcript returned by the backend', async () => {
    deviceCheckMocks.getConfig.mockResolvedValue(config);
    deviceCheckMocks.getTts.mockResolvedValue(new Blob(['mp3'], { type: 'audio/mpeg' }));
    let resolveStt: (value: {
      transcript: string;
      matchScore: number;
      level: 'GOOD';
      durationMs: number;
      language: string;
      suggestion: string;
    }) => void = () => undefined;
    deviceCheckMocks.postStt.mockImplementation(() => new Promise((resolve) => {
      resolveStt = resolve;
    }));
    deviceCheckMocks.useRecorder.mockReturnValue({
      isRecording: false,
      recordedBlob: new Blob(['recorded audio'], { type: 'audio/webm' }),
      recordedMimeType: 'audio/webm',
      durationSeconds: 5,
      error: null,
      audioUrl: null,
      fileName: 'device-check.webm',
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      clearRecording: vi.fn(),
    });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /nói thử/i }));
    const submit = screen.getByRole('button', { name: 'Gửi để kiểm tra giọng nói' });
    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => expect(deviceCheckMocks.postStt).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Đang gửi và xử lý câu trả lời…' })).toBeDisabled();
    expect(screen.queryByText(/phiên âm từng phần|đang phiên âm trực tiếp/i)).not.toBeInTheDocument();

    resolveStt({
      transcript: 'Đây là bản phiên âm cuối từ máy chủ.',
      matchScore: 0.95,
      level: 'GOOD',
      durationMs: 5000,
      language: 'vi',
      suggestion: 'Phát âm rõ.',
    });
    expect(await screen.findByText(/Đây là bản phiên âm cuối từ máy chủ/)).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('Phát âm rõ.')).toBeInTheDocument();
  });

  it('offers manual playback when autoplay is blocked and revokes the TTS object URL on unmount', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play')
      .mockRejectedValueOnce(new Error('Autoplay blocked'))
      .mockResolvedValue(undefined);
    const createObjectURL = vi.fn(() => 'blob:tts-audio');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    deviceCheckMocks.getConfig.mockResolvedValue(config);
    deviceCheckMocks.getTts.mockResolvedValue(new Blob(['mp3'], { type: 'audio/mpeg' }));
    deviceCheckMocks.useRecorder.mockReturnValue({
      isRecording: false,
      recordedBlob: null,
      recordedMimeType: '',
      durationSeconds: 0,
      error: null,
      audioUrl: null,
      fileName: '',
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      clearRecording: vi.fn(),
    });
    const { unmount } = renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /loa/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Phát âm thanh thử' }));
    expect(await screen.findByText(/Trình duyệt chưa tự phát âm thanh/)).toBeInTheDocument();
    expect(screen.getByLabelText('Nghe câu âm thanh thử')).toBeVisible();
    expect(createObjectURL).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Phát lại âm thanh' }));
    await waitFor(() => expect(play).toHaveBeenCalledTimes(2));
    expect(deviceCheckMocks.getTts).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Đang phát âm thanh.')).toBeInTheDocument();
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:tts-audio');
  });

  it('reports a playback error when the browser cannot decode the returned audio', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:invalid-audio') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    deviceCheckMocks.getConfig.mockResolvedValue(config);
    deviceCheckMocks.getTts.mockResolvedValue(new Blob(['not an mp3'], { type: 'audio/mpeg' }));
    deviceCheckMocks.useRecorder.mockReturnValue({
      isRecording: false,
      recordedBlob: null,
      recordedMimeType: '',
      durationSeconds: 0,
      error: null,
      audioUrl: null,
      fileName: '',
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      clearRecording: vi.fn(),
    });
    const { unmount } = renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /loa/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Phát âm thanh thử' }));
    const audio = await screen.findByLabelText('Nghe câu âm thanh thử');
    fireEvent.error(audio);
    expect(await screen.findByRole('alert')).toHaveTextContent('Không phát được tệp âm thanh từ máy chủ.');
    unmount();
  });
});
