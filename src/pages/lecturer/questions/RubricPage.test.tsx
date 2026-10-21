import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../context/LanguageContext';
import type { QuestionDetail, QuestionSummary } from '../../../types/question';
import RubricPage from './RubricPage';

const mocks = vi.hoisted(() => ({
  getGenerationQuestionById: vi.fn(),
  getGenerationQuestions: vi.fn(),
  getQuestionGenerationErrorMessage: vi.fn((_error: unknown, fallback: string) => fallback),
  getQuestionGenerationSubjects: vi.fn(),
  getQuestionGenerationTopics: vi.fn(),
  updateGenerationQuestion: vi.fn(),
}));

vi.mock('../../../services/question/questionService', () => mocks);

const question = (id: string, text: string): QuestionDetail => ({
  questionId: id,
  subjectId: 'subject-1',
  topicId: 'topic-1',
  createdBy: 'lecturer-1',
  questionText: text,
  referenceAnswer: 'Reference answer',
  bloomLevel: 'UNDERSTAND',
  sourceType: 'AI_GENERATED',
  status: 'DRAFT',
  estimatedDifficulty: 2,
  suggestedAnswerMinutes: 3,
  generationJobId: null,
  rubric: [
    { criteriaId: `${id}-1`, name: 'Accuracy', description: 'Correct facts.', maxPoints: 5, weight: 0.5 },
    { criteriaId: `${id}-2`, name: 'Clarity', description: 'Clear explanation.', maxPoints: 3, weight: 0.3 },
    { criteriaId: `${id}-3`, name: 'Example', description: 'Relevant example.', maxPoints: 2, weight: 0.2 },
  ],
  citations: [],
});

const summaries: QuestionSummary[] = [
  {
    questionId: 'q-1', subjectId: 'subject-1', topicId: 'topic-1', questionText: 'Compare interface and abstract class.',
    referenceAnswer: 'Explain the contract.', bloomLevel: 'UNDERSTAND', sourceType: 'AI_GENERATED', status: 'DRAFT',
    estimatedDifficulty: 2, suggestedAnswerMinutes: 3, createdAt: '2026-01-01T00:00:00Z', generationJobId: null,
  },
  {
    questionId: 'q-2', subjectId: 'subject-1', topicId: 'topic-1', questionText: 'Describe polymorphism.',
    referenceAnswer: null, bloomLevel: 'REMEMBER', sourceType: 'MANUAL', status: 'APPROVED',
    estimatedDifficulty: 1, suggestedAnswerMinutes: 2, createdAt: '2026-01-02T00:00:00Z', generationJobId: null,
  },
];

const pageResult = (page: number): { items: QuestionSummary[]; page: number; size: number; totalItems: number; totalPages: number } => ({
  items: page === 0 ? summaries.slice(0, 1) : summaries.slice(1),
  page,
  size: 100,
  totalItems: summaries.length,
  totalPages: 2,
});

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="rubric-location">{location.search}</output>;
}

function renderPage(initialEntries = ['/lecturer/rubrics']) {
  return render(
    <MemoryRouter initialEntries={initialEntries} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LanguageProvider><RubricPage /></LanguageProvider>
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe('RubricPage question selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('aiviva-language', 'vi');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mocks.getQuestionGenerationSubjects.mockResolvedValue([
      { subjectId: 'subject-1', subjectCode: 'SWD392', subjectName: 'Software Development Project' },
    ]);
    mocks.getQuestionGenerationTopics.mockResolvedValue([
      { topicId: 'topic-1', topicCode: 'TOPIC-001', topicName: 'Java basics', description: null },
    ]);
    mocks.getGenerationQuestions.mockImplementation(async (query: { page?: number }) => pageResult(query.page ?? 0));
    mocks.getGenerationQuestionById.mockImplementation(async (id: string) => question(id, id === 'q-2' ? 'Describe polymorphism.' : 'Compare interface and abstract class.'));
    mocks.updateGenerationQuestion.mockImplementation(async (_id: string, payload: Partial<QuestionDetail>) => ({ ...question('q-1', 'Compare interface and abstract class.'), ...payload }));
  });

  it('shows question content and server filters, then loads the selected question rubric', async () => {
    renderPage();
    expect(await screen.findByText('Compare interface and abstract class.')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Software Development Project/ })).toBeInTheDocument();
    expect(screen.getAllByText('Java basics').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText('Nội dung hoặc từ khóa'), { target: { value: 'interface' } });
    fireEvent.change(screen.getByLabelText('Môn học'), { target: { value: 'subject-1' } });
    await screen.findByRole('option', { name: 'TOPIC-001 · Java basics' });
    fireEvent.change(screen.getByLabelText('Chủ đề'), { target: { value: 'topic-1' } });
    fireEvent.change(screen.getByLabelText('Trạng thái duyệt'), { target: { value: 'DRAFT' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }));

    await waitFor(() => expect(mocks.getGenerationQuestions).toHaveBeenCalledWith(expect.objectContaining({
      bankOnly: false,
      subjectId: 'subject-1',
      topicId: 'topic-1',
      status: 'DRAFT',
      page: 0,
      size: 100,
    }), expect.any(AbortSignal)));
    expect(await screen.findByText('Compare interface and abstract class.')).toBeInTheDocument();
    expect(screen.queryByText('Describe polymorphism.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Chọn câu hỏi' }));
    expect(await screen.findByText('Rubric câu hỏi')).toBeInTheDocument();
    expect(mocks.getGenerationQuestionById).toHaveBeenCalledWith('q-1', expect.any(AbortSignal));
    expect(screen.getByText('Câu hỏi đã chọn')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Accuracy')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    await waitFor(() => expect(mocks.updateGenerationQuestion).toHaveBeenCalledWith('q-1', expect.objectContaining({
      questionText: 'Compare interface and abstract class.',
      rubric: expect.arrayContaining([expect.objectContaining({ name: 'Accuracy', maxPoints: 5 })]),
    })));
  });

  it('loads a selected question from the existing questionId deep link', async () => {
    renderPage(['/lecturer/rubrics?questionId=q-1']);
    expect(await screen.findByText('Câu hỏi đã chọn')).toBeInTheDocument();
    expect(mocks.getGenerationQuestionById).toHaveBeenCalledWith('q-1', expect.any(AbortSignal));
    expect(screen.getByDisplayValue('Accuracy')).toBeInTheDocument();
  });

  it('warns before switching questions when rubric edits are unsaved', async () => {
    renderPage();
    await screen.findByText('Compare interface and abstract class.');
    fireEvent.click(screen.getAllByRole('button', { name: 'Chọn câu hỏi' })[0]);
    await screen.findByText('Câu hỏi đã chọn');
    fireEvent.change(screen.getAllByLabelText('Tên tiêu chí')[0], { target: { value: 'Changed accuracy' } });

    vi.mocked(window.confirm).mockReturnValueOnce(false);
    fireEvent.click(screen.getByRole('button', { name: 'Chọn câu hỏi' }));
    expect(await screen.findByDisplayValue('Changed accuracy')).toBeInTheDocument();
    expect(screen.getByTestId('rubric-location')).toHaveTextContent('questionId=q-1');

    vi.mocked(window.confirm).mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole('button', { name: 'Chọn câu hỏi' }));
    expect(await screen.findByText('Describe polymorphism.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Accuracy')).toBeInTheDocument();
    expect(screen.getByTestId('rubric-location')).toHaveTextContent('questionId=q-2');
  });
});
