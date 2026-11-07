import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../context/LanguageContext';
import { StudentHistoryPage } from './StudentPages';

const mocks = vi.hoisted(() => ({ getStudentExamHistory: vi.fn() }));
vi.mock('../../services/exam/studentExamAssignmentApi', () => ({
  getStudentExamHistory: mocks.getStudentExamHistory,
  useMockExams: false,
}));

describe('StudentHistoryPage', () => {
  beforeEach(() => {
    mocks.getStudentExamHistory.mockResolvedValue({
      content: [{
        assignmentId: 'assignment-1', scheduledTime: null, assignmentStatus: 'SCHEDULED',
        sessionId: 'session-1', sessionName: 'Oral exam', sessionStatus: 'SCHEDULED',
        timeLimitMinutes: 15, maxMainQuestions: 3, maxFollowupPerQuestion: 2,
        attemptId: null, attemptStatus: null,
      }],
      page: 0, size: 10, totalElements: 1, totalPages: 1,
    });
  });

  it('shows an unscheduled state for a missing time instead of the Unix epoch', async () => {
    render(<LanguageProvider><MemoryRouter><StudentHistoryPage /></MemoryRouter></LanguageProvider>);

    expect(await screen.findAllByText('Chưa xếp lịch')).toHaveLength(2);
    expect(screen.queryByText(/1970/)).not.toBeInTheDocument();
  });
});
