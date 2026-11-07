import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import QuestionBankManagementPage from './QuestionBankManagementPage';
import { LanguageProvider } from '../../../context/LanguageContext';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useRubricTopics: vi.fn(),
  useQuestionBank: vi.fn(),
  GenerateQuestionPage: vi.fn((props: Record<string, unknown>) => null),
}));
vi.mock('../../../hooks/useAuth', () => ({ useAuth: mocks.useAuth }));
vi.mock('../../../hooks/useRubricTopics', () => ({ default: mocks.useRubricTopics }));
vi.mock('../../../hooks/useQuestionBank', () => ({ default: mocks.useQuestionBank }));
vi.mock('./GenerateQuestionPage', () => ({ default: mocks.GenerateQuestionPage }));

describe('QuestionBankManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('aiviva-language', 'vi');
    mocks.useAuth.mockReturnValue({ user: { role: 'LE' } });
    mocks.useRubricTopics.mockReturnValue({ subjects: [], topics: [], subjectId: '', setSubjectId: vi.fn(), loading: false, topicsLoading: false });
    mocks.useQuestionBank.mockReturnValue({ questions: [{ questionId: 'q-1', topicId: 'topic-1', questionText: 'Explain polymorphism', bloomLevel: 'UNDERSTAND', approvalStatus: 'APPROVED' }], loading: false, error: '', retry: vi.fn(), loadRubric: vi.fn().mockResolvedValue({ source: 'QUESTION_OVERRIDE', rubric: null, criteria: [{ criteriaName: 'Accuracy', expectedKnowledgePoints: 'Facts', weightRatio: 1 }] }), saveOverride: vi.fn().mockResolvedValue({ source: 'SUBJECT', rubric: null, criteria: [] }) });
  });

  it('passes bloom and approval filters, then renders the source badge and clears override', async () => {
    render(<LanguageProvider><MemoryRouter><QuestionBankManagementPage /></MemoryRouter></LanguageProvider>);
    fireEvent.change(screen.getByLabelText('Mức Bloom'), { target: { value: 'UNDERSTAND' } });
    fireEvent.change(screen.getByLabelText('Trạng thái duyệt'), { target: { value: 'APPROVED' } });
    await waitFor(() => expect(mocks.useQuestionBank).toHaveBeenLastCalledWith({ topicId: undefined, bloomLevel: 'UNDERSTAND', approvalStatus: 'APPROVED' }, true));
    fireEvent.click(screen.getByRole('button', { name: 'Mở rubric' }));
    expect(await screen.findByText('Ghi đè')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xóa override' }));
    await waitFor(() => expect(mocks.useQuestionBank.mock.results[0].value.saveOverride).toHaveBeenCalledWith('q-1', { criteria: [] }));
  });

  it('switches between the bank and inline generation views for lecturers only', async () => {
    const lecturerPage = render(<LanguageProvider><MemoryRouter><QuestionBankManagementPage /></MemoryRouter></LanguageProvider>);
    expect(screen.getByRole('tab', { name: 'Ngân hàng câu hỏi' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: 'Tạo câu hỏi' }));
    expect(screen.getByRole('tabpanel')).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const generatorProps = mocks.GenerateQuestionPage.mock.calls[mocks.GenerateQuestionPage.mock.calls.length - 1]?.[0] as {
      embedded: boolean;
      singleBloom: boolean;
      onGenerationComplete: (job: { subjectId: string; topicId: string }) => void;
    };
    expect(generatorProps).toMatchObject({ embedded: true, singleBloom: true });
    act(() => generatorProps.onGenerationComplete({ subjectId: 'subject-1', topicId: 'topic-1' }));
    await waitFor(() => expect(mocks.useQuestionBank).toHaveBeenLastCalledWith({
      topicId: 'topic-1', bloomLevel: undefined, approvalStatus: 'DRAFT',
    }, true));
    fireEvent.click(screen.getByRole('tab', { name: 'Ngân hàng câu hỏi' }));
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'question-bank-view-bank');

    lecturerPage.unmount();
    mocks.useAuth.mockReturnValue({ user: { role: 'ADMIN' } });
    render(<LanguageProvider><MemoryRouter><QuestionBankManagementPage /></MemoryRouter></LanguageProvider>);
    expect(screen.queryByRole('tab', { name: 'Tạo câu hỏi' })).not.toBeInTheDocument();
  });

  it('translates the generation action into English', () => {
    localStorage.setItem('aiviva-language', 'en');
    render(<LanguageProvider><MemoryRouter><QuestionBankManagementPage /></MemoryRouter></LanguageProvider>);
    expect(screen.getByRole('tab', { name: 'Generate questions' })).toBeInTheDocument();
  });
});
