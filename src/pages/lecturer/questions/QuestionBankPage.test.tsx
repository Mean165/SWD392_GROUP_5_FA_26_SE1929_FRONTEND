import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../context/LanguageContext';
import QuestionBankPage from './QuestionBankPage';

const questionServiceMock = vi.hoisted(() => ({
  approveGenerationQuestion: vi.fn(),
  approveGenerationQuestions: vi.fn(),
  createQuestionGenerationJob: vi.fn(),
  deleteQuestionDocument: vi.fn(),
  getGenerationQuestions: vi.fn(),
  getQuestionDocument: vi.fn(),
  getQuestionDocuments: vi.fn(),
  getQuestionGenerationErrorMessage: vi.fn((_error: unknown, fallback: string) => fallback),
  getQuestionGenerationJob: vi.fn(),
  getQuestionGenerationRetryAfter: vi.fn(),
  getQuestionGenerationSubjects: vi.fn(),
  getQuestionGenerationTopics: vi.fn(),
  rejectGenerationQuestion: vi.fn(),
  uploadQuestionDocument: vi.fn(),
}));

vi.mock('../../../services/question/questionService', () => questionServiceMock);

const renderPage = (initialEntries = ['/lecturer/questions']) => render(
  <LanguageProvider>
    <MemoryRouter initialEntries={initialEntries} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QuestionBankPage />
    </MemoryRouter>
  </LanguageProvider>,
);

describe('QuestionBankPage tabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('aiviva-question-generation-job');
    questionServiceMock.getQuestionGenerationSubjects.mockResolvedValue([]);
    questionServiceMock.getQuestionGenerationTopics.mockResolvedValue([]);
    questionServiceMock.getQuestionDocuments.mockResolvedValue([]);
    questionServiceMock.getGenerationQuestions.mockResolvedValue({
      items: [],
      page: 0,
      size: 20,
      totalItems: 0,
      totalPages: 0,
    });
  });

  it('shows only the three in-place tabs and loads all saved question statuses in the list tab', async () => {
    renderPage();

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent?.trim())).toEqual([
      'Tạo câu hỏi AI / RAG',
      'Duyệt câu hỏi',
      'Danh sách câu hỏi',
    ]);

    fireEvent.click(screen.getByRole('tab', { name: 'Danh sách câu hỏi' }));

    await waitFor(() => expect(questionServiceMock.getGenerationQuestions).toHaveBeenCalledWith(
      expect.objectContaining({ bankOnly: false, page: 0, size: 20 }),
      expect.any(AbortSignal),
    ));
    expect(await screen.findByText('Chưa có câu hỏi phù hợp.')).toBeVisible();
  });

  it('preserves the generation form when switching between tabs', () => {
    const { container } = renderPage();
    const questionCount = container.querySelector<HTMLInputElement>('input[type="number"][min="1"][step="1"]');
    expect(questionCount).not.toBeNull();
    fireEvent.change(questionCount as HTMLInputElement, { target: { value: '6' } });

    fireEvent.click(screen.getByRole('tab', { name: 'Duyệt câu hỏi' }));
    expect(screen.getByRole('heading', { name: 'Bản nháp cần duyệt' })).toBeVisible();
    fireEvent.click(screen.getByRole('tab', { name: 'Tạo câu hỏi AI / RAG' }));

    expect(questionCount).toHaveValue(6);
  });

  it('confirms a draft rejection in the app dialog before calling the service', async () => {
    questionServiceMock.getGenerationQuestions.mockResolvedValueOnce({
      items: [{
        questionId: 'question-1',
        subjectId: 'subject-1',
        topicId: 'topic-1',
        questionText: 'Draft question',
        referenceAnswer: null,
        bloomLevel: 'APPLY',
        sourceType: 'AI_GENERATED',
        status: 'DRAFT',
        estimatedDifficulty: null,
        suggestedAnswerMinutes: null,
        createdAt: '2026-10-21T00:00:00Z',
        generationJobId: 'job-1',
      }],
      page: 0,
      size: 10,
      totalItems: 1,
      totalPages: 1,
    });
    questionServiceMock.rejectGenerationQuestion.mockResolvedValue({ questionId: 'question-1', status: 'REJECTED' });

    renderPage(['/lecturer/questions?tab=review']);

    fireEvent.click(await screen.findByRole('button', { name: 'Từ chối' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Xác nhận từ chối bản nháp' });
    expect(questionServiceMock.rejectGenerationQuestion).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(questionServiceMock.rejectGenerationQuestion).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Từ chối' }));
    const reopenedDialog = await screen.findByRole('alertdialog');
    fireEvent.click(within(reopenedDialog).getByRole('button', { name: 'Từ chối bản nháp' }));
    await waitFor(() => expect(questionServiceMock.rejectGenerationQuestion).toHaveBeenCalledWith('question-1'));
  });

  it('opens directly on the question list tab for the bank-list URL', async () => {
    renderPage(['/lecturer/questions?tab=list']);

    expect(screen.getByRole('tab', { name: 'Danh sách câu hỏi' })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByRole('heading', { name: 'Danh sách câu hỏi' })).toBeVisible();
    await waitFor(() => expect(questionServiceMock.getGenerationQuestions).toHaveBeenCalledWith(
      expect.objectContaining({ bankOnly: false, page: 0, size: 20 }),
      expect.any(AbortSignal),
    ));
  });
});
