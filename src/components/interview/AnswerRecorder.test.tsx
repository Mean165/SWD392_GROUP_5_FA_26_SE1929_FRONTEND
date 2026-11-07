import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LanguageProvider } from '../../context/LanguageContext';
import AnswerRecorder from './AnswerRecorder';

const stt = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn(), options: undefined as unknown, state: 'idle', finals: [] as string[], partial: '' }));
vi.mock('../../hooks/useSttSession', () => ({ useSttSession: (options: unknown) => { stt.options = options; return { state: stt.state, level: 0, error: '', finals: stt.finals, partial: stt.partial, start: stt.start, stop: stt.stop }; } }));

const props = { examAttemptId: 'exam-attempt-id', turnId: 'turn-id', recordingAvailable: false, isSubmitting: false, submitError: null, onSubmit: vi.fn(), onDiscard: vi.fn() };
afterEach(() => { vi.clearAllMocks(); stt.state = 'idle'; stt.finals = []; stt.partial = ''; });

describe('AnswerRecorder WebSocket mode', () => {
  it('starts an EXAM session with attempt and turn IDs and stops on command', () => {
    stt.finals = ['This recognized text should stay hidden'];
    stt.partial = 'partial transcript';
    const { rerender } = render(<LanguageProvider><AnswerRecorder {...props} /></LanguageProvider>);
    expect(stt.options).toMatchObject({ purpose: 'EXAM', attemptId: 'exam-attempt-id', turnId: 'turn-id' });
    expect(stt.options).toMatchObject({ deviceId: undefined });
    expect(screen.getByLabelText('Micro đầu vào')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu trả lời' }));
    expect(stt.start).toHaveBeenCalledTimes(1);
    stt.state = 'listening';
    rerender(<LanguageProvider><AnswerRecorder {...props} /></LanguageProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Dừng và gửi câu trả lời' }));
    expect(stt.stop).toHaveBeenCalledTimes(1);
    expect(stt.options).toMatchObject({ onEnded: expect.any(Function) });
    (stt.options as { onEnded: (text: string) => void }).onEnded('Recognized answer');
    expect(props.onSubmit).toHaveBeenCalledWith('Recognized answer');
    expect(screen.queryByText('Bản ghi nhận diện')).not.toBeInTheDocument();
    expect(screen.queryByText('This recognized text should stay hidden')).not.toBeInTheDocument();
    expect(screen.queryByText('partial transcript')).not.toBeInTheDocument();
  });
});
