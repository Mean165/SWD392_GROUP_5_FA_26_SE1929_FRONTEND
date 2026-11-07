import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../context/LanguageContext';
import CreateExamPage from './CreateExamPage';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(), useExamTopics: vi.fn(), createExamSession: vi.fn(), updateExamSession: vi.fn(),
  getExamSession: vi.fn(), getExamSessionStudents: vi.fn(),
}));
vi.mock('../../../hooks/useAuth', () => ({ useAuth: mocks.useAuth }));
vi.mock('../../../hooks/useExamTopics', () => ({ default: mocks.useExamTopics }));
vi.mock('../../../api/examSessionApi', () => ({
  createExamSession: mocks.createExamSession,
  updateExamSession: mocks.updateExamSession,
  getExamSession: mocks.getExamSession,
  getExamSessionStudents: mocks.getExamSessionStudents,
  getExamSessionError: vi.fn((_error: unknown, fallback: string) => fallback),
}));

describe('CreateExamPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuth.mockReturnValue({ user: { role: 'ADMIN' } });
    mocks.useExamTopics.mockReturnValue({ topics: [{ topicId: 't-1', topicCode: 'TOP', topicName: 'Topic', subjectName: 'Software' }], loading: false, error: '', retry: vi.fn() });
    mocks.createExamSession.mockResolvedValue({ sessionId: 'session-1' });
    mocks.updateExamSession.mockResolvedValue({ sessionId: 'session-1' });
    mocks.getExamSession.mockResolvedValue({ sessionId: 'session-1', topicId: 't-1', topicName: 'Topic', sessionName: 'Existing', maxMainQuestions: 3, maxFollowupPerQuestion: 2, timeLimitMinutes: 15, status: 'SCHEDULED', startTime: null });
    mocks.getExamSessionStudents.mockResolvedValue({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 });
  });

  it('requires a topic and sends it when creating a session', async () => {
    render(<LanguageProvider><MemoryRouter><CreateExamPage /></MemoryRouter></LanguageProvider>);
    fireEvent.change(screen.getByLabelText('Tên phiên thi'), { target: { value: 'Oral test' } });
    fireEvent.change(screen.getByLabelText('Môn/chủ đề'), { target: { value: 't-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tạo phiên thi' }));
    await waitFor(() => expect(mocks.createExamSession).toHaveBeenCalledWith(expect.objectContaining({ topicId: 't-1', sessionName: 'Oral test', maxOverlapPercent: 40 })));
  });

  it('uses update for edit and includes the selected topic', async () => {
    render(<LanguageProvider><MemoryRouter initialEntries={['/lecturer/exam-sessions/session-1/edit']}><Routes><Route path="/lecturer/exam-sessions/:id/edit" element={<CreateExamPage />} /></Routes></MemoryRouter></LanguageProvider>);
    expect(await screen.findByDisplayValue('Existing')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    await waitFor(() => expect(mocks.updateExamSession).toHaveBeenCalledWith('session-1', expect.objectContaining({ topicId: 't-1' })));
  });

  it('validates a Bloom distribution against the main question count', () => {
    render(<LanguageProvider><MemoryRouter><CreateExamPage /></MemoryRouter></LanguageProvider>);
    fireEvent.click(screen.getByLabelText('Chỉ định số câu cho từng mức'));
    fireEvent.change(screen.getByLabelText('Nhớ (REMEMBER)'), { target: { value: '0' } });
    expect(screen.getByRole('button', { name: 'Tạo phiên thi' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Nhớ (REMEMBER)'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Hiểu (UNDERSTAND)'), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText('Vận dụng (APPLY)'), { target: { value: '0' } });
    expect(screen.getByRole('button', { name: 'Tạo phiên thi' })).toBeEnabled();
  });
});
