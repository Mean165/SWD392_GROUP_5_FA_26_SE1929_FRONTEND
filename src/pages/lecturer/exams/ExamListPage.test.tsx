import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../context/LanguageContext';
import ExamListPage from './ExamListPage';

const mocks = vi.hoisted(() => ({ useAuth: vi.fn(), useExamTopics: vi.fn(), useExamSessions: vi.fn() }));
vi.mock('../../../hooks/useAuth', () => ({ useAuth: mocks.useAuth }));
vi.mock('../../../hooks/useExamTopics', () => ({ default: mocks.useExamTopics }));
vi.mock('../../../hooks/useExamSessions', () => ({ default: mocks.useExamSessions }));

describe('ExamListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuth.mockReturnValue({ user: { role: 'LECTURER' } });
    mocks.useExamTopics.mockReturnValue({ topics: [{ topicId: 'topic-1', topicName: 'Software design' }], loading: false, error: '', retry: vi.fn() });
    mocks.useExamSessions.mockReturnValue({ result: { content: [{ sessionId: 'cancelled-1', sessionName: 'Cancelled oral', topicId: 'topic-1', topicName: 'Software design', maxMainQuestions: 3, maxFollowupPerQuestion: 1, timeLimitMinutes: 15, status: 'CANCELLED', startTime: null, createdAt: '', statistics: { studentCount: 2, completedCount: 1, absentCount: 1 } }], page: 0, size: 10, totalElements: 1, totalPages: 1 }, loading: false, error: '', retry: vi.fn() });
  });

  it('filters sessions, shows quick statistics and dims cancelled rows', async () => {
    const { container } = render(<LanguageProvider><MemoryRouter><ExamListPage /></MemoryRouter></LanguageProvider>);
    expect(screen.getByText('Cancelled oral')).toBeInTheDocument();
    expect(screen.getAllByText('Đã hủy').length).toBeGreaterThan(0);
    expect(container.querySelector('tr.is-cancelled')).toBeInTheDocument();
    expect(screen.getByText('1 phiên')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Trạng thái'), { target: { value: 'CANCELLED' } });
    await waitFor(() => expect(mocks.useExamSessions).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'CANCELLED', page: 0, size: 10 })));
  });
});
