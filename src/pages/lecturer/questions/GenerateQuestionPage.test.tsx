import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../context/LanguageContext';
import GenerateQuestionPage from './GenerateQuestionPage';

const questionServiceMock = vi.hoisted(() => ({
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
  uploadQuestionDocument: vi.fn(),
}));

vi.mock('../../../services/question/questionService', () => questionServiceMock);

const renderPage = () => render(
  <LanguageProvider>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <GenerateQuestionPage embedded />
    </MemoryRouter>
  </LanguageProvider>,
);

describe('GenerateQuestionPage subject and topic selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('aiviva-language', 'vi');
    localStorage.removeItem('aiviva-question-generation-job');
    questionServiceMock.getQuestionGenerationSubjects.mockResolvedValue([
      { subjectId: 'subject-1', subjectCode: 'SWD392', subjectName: 'Software Development Project' },
    ]);
    questionServiceMock.getQuestionGenerationTopics.mockResolvedValue([
      { topicId: 'topic-1', topicCode: 'TOPIC-001', topicName: 'Lập trình Java cơ bản', description: null },
    ]);
    questionServiceMock.getQuestionDocuments.mockResolvedValue([]);
    questionServiceMock.getGenerationQuestions.mockResolvedValue({
      items: [],
      page: 0,
      size: 10,
      totalItems: 0,
      totalPages: 0,
    });
  });

  it('loads topics for the selected subject and enables upload only after selecting a topic', async () => {
    renderPage();

    const subjectSelect = await screen.findByLabelText('Môn học');
    const topicSelect = screen.getByLabelText('Chủ đề');
    const fileInput = screen.getByLabelText('Tải PDF, PPTX hoặc DOCX');

    expect(subjectSelect).toHaveValue('');
    expect(topicSelect).toBeDisabled();
    expect(fileInput).toBeDisabled();

    fireEvent.change(subjectSelect, { target: { value: 'subject-1' } });
    expect(await screen.findByRole('option', { name: 'TOPIC-001 · Lập trình Java cơ bản' })).toBeInTheDocument();
    expect(topicSelect).toBeEnabled();
    expect(fileInput).toBeDisabled();
    expect(questionServiceMock.getQuestionGenerationTopics).toHaveBeenCalledWith('subject-1', expect.any(AbortSignal));

    fireEvent.change(topicSelect, { target: { value: 'topic-1' } });
    await waitFor(() => expect(questionServiceMock.getQuestionDocuments).toHaveBeenCalledWith('subject-1', 'topic-1', expect.any(AbortSignal)));
    await waitFor(() => expect(fileInput).toBeEnabled());
  });

  it('keeps request errors distinct from a successful empty subject response and offers retry', async () => {
    questionServiceMock.getQuestionGenerationSubjects
      .mockRejectedValueOnce(new Error('request failed'))
      .mockResolvedValueOnce([
        { subjectId: 'subject-1', subjectCode: 'SWD392', subjectName: 'Software Development Project' },
      ]);
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải danh sách môn học.');
    expect(screen.queryByText(/không có môn học nào được gán/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByRole('option', { name: /SWD392/ })).toBeInTheDocument();
    expect(questionServiceMock.getQuestionGenerationSubjects).toHaveBeenCalledTimes(2);
  });

  it('places an empty assignment notice across the scope form without stretching one field', async () => {
    questionServiceMock.getQuestionGenerationSubjects.mockResolvedValueOnce([]);
    renderPage();

    const notice = await screen.findByRole('status');
    expect(notice).toHaveTextContent('Không có môn học nào được gán');
    expect(notice).toHaveClass('qg-scope-notice');
    expect(notice.parentElement).toHaveClass('qg-form');
    expect(screen.getByLabelText('Chủ đề')).toBeDisabled();
  });
});
