import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../context/LanguageContext';
import DeviceCheckPage from './DeviceCheckPage';

const mocks = vi.hoisted(() => ({
  health: vi.fn(), tts: vi.fn(), start: vi.fn(), stop: vi.fn(), clear: vi.fn(),
}));
const readyHealth = { stt: { ready: true, provider: 'local', engine: 'faster-whisper', model: 'local-model', device: 'cpu', reason: '', languages: ['vi-VN', 'en-US'] }, tts: { ready: true, provider: 'local', engine: 'piper', model: 'local-voice', device: 'cpu', reason: '' }, resources: {}, versions: {}, sampleRate: 16000, encoding: 'pcm_s16le', maxDurationSeconds: 60 };
vi.mock('../../services/deviceCheck/deviceCheckApi', () => ({
  getDeviceCheckSttHealth: mocks.health,
  getDeviceCheckError: (e: unknown) => e instanceof Error ? e : new Error('network'),
  getDeviceCheckTts: mocks.tts,
}));
vi.mock('../../hooks/useSttSession', () => ({ useSttSession: () => ({
  state: 'idle', level: 0, hasSignal: false, partial: '', finals: [], error: '',
  start: mocks.start, stop: mocks.stop, clearTranscript: mocks.clear,
}) }));

const renderPage = () => render(<LanguageProvider><MemoryRouter><DeviceCheckPage /></MemoryRouter></LanguageProvider>);
afterEach(() => { vi.clearAllMocks(); sessionStorage.clear(); });

describe('DeviceCheckPage', () => {
  it('shows only Micro and Loa and preserves the optional room entry path', async () => {
    mocks.health.mockResolvedValue(readyHealth);
    renderPage();
    expect(await screen.findByRole('button', { name: /Micro/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Loa/ })).toBeInTheDocument();
    expect(screen.getAllByRole('button').filter((button) => /Micro|Loa/.test(button.textContent ?? ''))).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Bỏ qua và vào lịch thi' })).toHaveAttribute('href', '/student/exams');
  });

  it('shows STT unavailable without hanging and prevents starting', async () => {
    mocks.health.mockResolvedValue({ ...readyHealth, stt: { ...readyHealth.stt, ready: false, reason: 'model_files_missing' } });
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Dịch vụ nhận diện chưa sẵn sàng');
    expect(screen.getByRole('button', { name: 'Bắt đầu' })).toBeDisabled();
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it('requires an explicit clear-audio confirmation before recording the check as passed', async () => {
    mocks.health.mockResolvedValue(readyHealth);
    renderPage();
    await screen.findByRole('button', { name: /Micro/ });
    fireEvent.click(screen.getByRole('button', { name: /Loa/ }));
    expect(sessionStorage.getItem('deviceCheckPassedAt')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tôi nghe rõ' }));
    expect(sessionStorage.getItem('deviceCheckPassedAt')).toBeNull();
  });

  it('shows the safe TTS API error instead of masking it as a speaker playback failure', async () => {
    mocks.health.mockResolvedValue(readyHealth);
    mocks.tts.mockRejectedValue(new Error('Không thể kết nối đến máy chủ. Hãy kiểm tra kết nối mạng rồi thử lại.'));
    renderPage();
    await screen.findByRole('button', { name: /Loa/ });
    fireEvent.click(screen.getByRole('button', { name: /Loa/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Phát âm thanh' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể kết nối đến máy chủ');
  });
});
