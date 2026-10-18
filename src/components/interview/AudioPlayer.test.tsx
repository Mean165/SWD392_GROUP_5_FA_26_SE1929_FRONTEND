import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AudioPlayer from './AudioPlayer';

const speechMocks = vi.hoisted(() => ({
  getTurnSpeech: vi.fn(),
  getInterviewErrorMessage: vi.fn((error: unknown) => error instanceof Error ? error.message : 'TTS error'),
}));

vi.mock('../../services/interview/interviewService', () => ({
  getTurnSpeech: speechMocks.getTurnSpeech,
  getInterviewErrorMessage: speechMocks.getInterviewErrorMessage,
}));

let createObjectURLDescriptor: PropertyDescriptor | undefined;
let revokeObjectURLDescriptor: PropertyDescriptor | undefined;

beforeEach(() => {
  createObjectURLDescriptor = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  revokeObjectURLDescriptor = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:question-audio'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (createObjectURLDescriptor) Object.defineProperty(URL, 'createObjectURL', createObjectURLDescriptor);
  else Reflect.deleteProperty(URL, 'createObjectURL');
  if (revokeObjectURLDescriptor) Object.defineProperty(URL, 'revokeObjectURL', revokeObjectURLDescriptor);
  else Reflect.deleteProperty(URL, 'revokeObjectURL');
});

describe('AudioPlayer', () => {
  it('reports TTS errors and provides an explicit retry action', async () => {
    speechMocks.getTurnSpeech.mockRejectedValueOnce(new Error('Không lấy được audio TTS.'));
    speechMocks.getTurnSpeech.mockResolvedValueOnce(new Blob(['mp3'], { type: 'audio/mpeg' }));
    render(<AudioPlayer turnId="turn-uuid" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Không lấy được audio TTS.');
    fireEvent.click(screen.getByRole('button', { name: 'Tải lại âm thanh câu hỏi' }));
    expect(await screen.findByRole('button', { name: 'Phát câu hỏi' })).toBeInTheDocument();
    expect(speechMocks.getTurnSpeech).toHaveBeenCalledTimes(2);
  });

  it('supports manual playback, pause, and replay', async () => {
    speechMocks.getTurnSpeech.mockResolvedValue(new Blob(['mp3'], { type: 'audio/mpeg' }));
    render(<AudioPlayer turnId="turn-uuid" />);
    const playButton = await screen.findByRole('button', { name: 'Phát câu hỏi' });
    const audio = document.querySelector('audio');
    expect(audio).not.toBeNull();

    fireEvent.click(playButton);
    await waitFor(() => expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce());
    fireEvent.play(audio as HTMLAudioElement);
    expect(screen.getByText('Đang phát câu hỏi.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tạm dừng câu hỏi' }));
    fireEvent.pause(audio as HTMLAudioElement);
    expect(screen.getByText('Đã tạm dừng câu hỏi.')).toBeInTheDocument();
    fireEvent.ended(audio as HTMLAudioElement);
    const playCountBeforeReplay = vi.mocked(HTMLMediaElement.prototype.play).mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Phát câu hỏi' }));
    await waitFor(() => {
      expect(vi.mocked(HTMLMediaElement.prototype.play).mock.calls.length).toBeGreaterThan(playCountBeforeReplay);
    });
  });

  it('handles a browser-blocked play gesture without synthesizing speech and revokes the Blob URL', async () => {
    speechMocks.getTurnSpeech.mockResolvedValue(new Blob(['mp3'], { type: 'audio/mpeg' }));
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new Error('blocked'));
    const { unmount } = render(<AudioPlayer turnId="turn-uuid" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Phát câu hỏi' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('nhấn nút phát để thử lại');
    expect(speechMocks.getTurnSpeech).toHaveBeenCalledWith('turn-uuid', expect.any(AbortSignal));
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:question-audio');
  });

  it('ignores an older turn response when the current turn changes', async () => {
    let resolveOld: (blob: Blob) => void = () => undefined;
    speechMocks.getTurnSpeech.mockImplementationOnce(() => new Promise((resolve) => {
      resolveOld = resolve;
    }));
    speechMocks.getTurnSpeech.mockResolvedValueOnce(new Blob(['new turn'], { type: 'audio/mpeg' }));
    const createObjectURL = vi.mocked(URL.createObjectURL);
    createObjectURL.mockReturnValue('blob:new-turn');
    const view = render(<AudioPlayer turnId="old-turn" />);
    view.rerender(<AudioPlayer turnId="new-turn" />);
    await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));
    resolveOld(new Blob(['old turn'], { type: 'audio/mpeg' }));
    await waitFor(() => expect(speechMocks.getTurnSpeech).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('button', { name: 'Phát câu hỏi' })).toBeInTheDocument();
    expect(createObjectURL).toHaveBeenCalledTimes(1);
  });
});
