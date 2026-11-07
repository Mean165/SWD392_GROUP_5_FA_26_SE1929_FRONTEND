import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../context/LanguageContext';
import EvaluationListPage from './EvaluationListPage';

const mocks = vi.hoisted(() => ({ getGradingQueue: vi.fn() }));
vi.mock('../../../api/gradingApi', () => ({
  getGradingQueue: mocks.getGradingQueue,
  getGradingErrorMessage: (error: unknown) => error instanceof Error ? error.message : 'load failed',
}));

describe('EvaluationListPage', () => {
  beforeEach(() => {
    mocks.getGradingQueue.mockResolvedValue({
      page: 0, size: 20, total: 1,
      items: [{
        submissionId: 'submission-1', examId: 'exam-1', examName: 'Vấn đáp Java',
        studentId: 'student-1', studentName: 'Bùi Đức Anh', attemptNo: 1,
        status: 'IN_REVIEW', aiStatus: 'DONE', priorityScore: 2,
        sessionFinishedAt: '2026-11-05T09:00:00Z', aiScoredAt: null, finalizedAt: null, lecturerTotalScore: 7.35, version: 1,
      }],
    });
  });

  it('shows real student submissions and links to their answer details', async () => {
    render(<LanguageProvider><MemoryRouter><EvaluationListPage /></MemoryRouter></LanguageProvider>);

    expect(await screen.findByText('Bùi Đức Anh')).toBeInTheDocument();
    expect(screen.getByText('Vấn đáp Java')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Tổng điểm' })).toBeInTheDocument();
    expect(screen.getByText('7,35 / 10')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mở bài thi' })).toHaveAttribute('href', '/lecturer/evaluations/submission-1');
    expect(mocks.getGradingQueue).toHaveBeenCalledWith(expect.objectContaining({ page: 0, size: 20 }), expect.any(AbortSignal));
  });
});
