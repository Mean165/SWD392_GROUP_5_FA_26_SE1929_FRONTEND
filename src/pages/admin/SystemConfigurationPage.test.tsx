import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../context/LanguageContext';
import SystemConfigurationPage from './SystemConfigurationPage';

const mocks = vi.hoisted(() => ({
  getLanguageDefaults: vi.fn(),
  updateLanguageDefaults: vi.fn(),
  handleUnauthorized: vi.fn(),
}));

vi.mock('../../services/system/systemService', () => ({
  getLanguageDefaults: mocks.getLanguageDefaults,
  updateLanguageDefaults: mocks.updateLanguageDefaults,
}));
vi.mock('./useAdminSession', () => ({ default: () => mocks.handleUnauthorized }));

describe('SystemConfigurationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getLanguageDefaults.mockResolvedValue({ sttLanguage: 'VI', ttsLanguage: 'EN' });
    mocks.updateLanguageDefaults.mockImplementation(async (value) => value);
  });

  it('loads VI/EN defaults and enables saving only after a change', async () => {
    render(<MemoryRouter><LanguageProvider><SystemConfigurationPage /></LanguageProvider></MemoryRouter>);
    const saveButton = await screen.findByRole('button', { name: 'Lưu thay đổi' });
    expect(mocks.getLanguageDefaults).toHaveBeenCalledTimes(1);
    expect(saveButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Ngôn ngữ STT'), { target: { value: 'EN' } });
    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton);
    await waitFor(() => expect(mocks.updateLanguageDefaults).toHaveBeenCalledWith({ sttLanguage: 'EN', ttsLanguage: 'EN' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Cấu hình đã được lưu.');
    expect(saveButton).toBeDisabled();
  });

  it('restricts both selectors to VI and EN and displays load errors with retry', async () => {
    mocks.getLanguageDefaults.mockRejectedValueOnce({ response: { status: 500 } });
    render(<MemoryRouter><LanguageProvider><SystemConfigurationPage /></LanguageProvider></MemoryRouter>);
    expect(await screen.findByText('Không thể tải cấu hình ngôn ngữ.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    await screen.findByLabelText('Ngôn ngữ STT');
    const stt = screen.getByLabelText('Ngôn ngữ STT') as HTMLSelectElement;
    const tts = screen.getByLabelText('Ngôn ngữ TTS') as HTMLSelectElement;
    expect(Array.from(stt.options).map((option) => option.value)).toEqual(['VI', 'EN']);
    expect(Array.from(tts.options).map((option) => option.value)).toEqual(['VI', 'EN']);
    expect(mocks.getLanguageDefaults).toHaveBeenCalledTimes(2);
  });
});
