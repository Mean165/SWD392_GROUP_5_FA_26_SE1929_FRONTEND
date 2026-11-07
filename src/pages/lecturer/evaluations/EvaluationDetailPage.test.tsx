import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../context/LanguageContext';
import EvaluationDetailPage from './EvaluationDetailPage';

const mocks = vi.hoisted(() => ({ getGradingSubmission: vi.fn(), claimGradingSubmission: vi.fn(), enqueueGradingAiRun: vi.fn(), renewGradingLock: vi.fn(), saveGradingScores: vi.fn() }));
vi.mock('../../../api/gradingApi', () => ({
  getGradingSubmission: mocks.getGradingSubmission,
  claimGradingSubmission: mocks.claimGradingSubmission,
  enqueueGradingAiRun: mocks.enqueueGradingAiRun,
  renewGradingLock: mocks.renewGradingLock,
  saveGradingScores: mocks.saveGradingScores,
  getGradingErrorMessage: (error: unknown) => error instanceof Error ? error.message : 'load failed',
}));

const submission = (status: string) => ({
  submissionId: 'submission-1', examId: 'exam-1', examName: 'Oral exam', studentId: 'student-1',
  studentName: 'Student One', attemptNo: 1, status, aiStatus: 'NONE', priorityScore: 0,
  sessionFinishedAt: null, aiScoredAt: null, finalizedAt: null, version: status === 'IN_REVIEW' ? 5 : 4,
  turns: [{ turnId: 'turn-1', questionId: 'question-1', turnOrder: 1, turnType: 'MAIN', bloomLevel: 'REMEMBER', questionText: 'Question', transcriptText: 'Answer', normalizedText: null, needsHumanReview: false }],
  aiSuggestions: [],
  rubricCriteria: [{ criterionId: 'criterion-1', name: 'Correctness', expectedPoints: 'Key concepts', weight: 1 }],
  lecturerScores: [],
  questionMaxScores: { 'question-1': 10 },
});

const renderPage = () => render(<LanguageProvider><MemoryRouter initialEntries={['/lecturer/evaluations/submission-1']}><Routes><Route path="/lecturer/evaluations/:id" element={<EvaluationDetailPage />} /></Routes></MemoryRouter></LanguageProvider>);

describe('EvaluationDetailPage score fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getGradingSubmission.mockResolvedValueOnce(submission('AI_PENDING')).mockResolvedValue(submission('IN_REVIEW'));
    mocks.claimGradingSubmission.mockResolvedValue({});
    mocks.enqueueGradingAiRun.mockResolvedValue({});
    mocks.renewGradingLock.mockResolvedValue({});
    mocks.saveGradingScores.mockResolvedValue(undefined);
  });

  it('leaves AI suggestions blank and saves the lecturer score after claiming the submission', async () => {
    renderPage();
    expect(await screen.findByPlaceholderText('Chưa có đề xuất')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nhận chấm bài' })).not.toBeInTheDocument();
    await waitFor(() => expect(mocks.claimGradingSubmission).toHaveBeenCalledWith('submission-1'));
    const score = screen.getByRole('spinbutton', { name: 'Điểm giảng viên câu 1' });
    await waitFor(() => expect(score).toBeEnabled());
    fireEvent.change(score, { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu điểm giảng viên' }));

    await waitFor(() => expect(mocks.saveGradingScores).toHaveBeenCalledWith('submission-1', 5, [{
      questionId: 'question-1', criterionId: 'criterion-1', score: 8, maxScore: 10,
      source: 'MANUAL', overrideReason: null, comment: null,
    }], []));
    expect(mocks.renewGradingLock).toHaveBeenCalledWith('submission-1');
  });

  it('displays the sum of AI criterion suggestions for each question', async () => {
    const scoredSubmission = {
      ...submission('FINALIZED'),
      aiSuggestions: [
        { questionId: 'question-1', criteriaId: 'criterion-1', criteriaName: 'Correctness', points: 1.25, missingConcepts: null, reasoning: null },
        { questionId: 'question-1', criteriaId: 'criterion-2', criteriaName: 'Completeness', points: 0.75, missingConcepts: null, reasoning: null },
      ],
    };
    mocks.getGradingSubmission.mockReset();
    mocks.getGradingSubmission.mockResolvedValue(scoredSubmission);
    renderPage();

    expect(await screen.findByDisplayValue('2,00')).toBeInTheDocument();
    expect(mocks.claimGradingSubmission).not.toHaveBeenCalled();
  });

  it('uses AI for blank questions, lecturer scores for filled questions, and sums both', async () => {
    const mixedSubmission = {
      ...submission('AI_PENDING'),
      turns: [
        { turnId: 'turn-1', questionId: 'question-1', turnOrder: 1, turnType: 'MAIN', bloomLevel: 'REMEMBER', questionText: 'Question 1', transcriptText: 'Answer', normalizedText: null, needsHumanReview: false },
        { turnId: 'turn-2', questionId: 'question-2', turnOrder: 2, turnType: 'MAIN', bloomLevel: 'APPLY', questionText: 'Question 2', transcriptText: 'Answer', normalizedText: null, needsHumanReview: false },
      ],
      aiSuggestions: [
        { questionId: 'question-1', criteriaId: 'criterion-1', criteriaName: 'Correctness', points: 2, missingConcepts: null, reasoning: null },
        { questionId: 'question-2', criteriaId: 'criterion-1', criteriaName: 'Correctness', points: 1, missingConcepts: null, reasoning: null },
      ],
      questionMaxScores: { 'question-1': 4, 'question-2': 6 },
    };
    const claimedMixedSubmission = { ...mixedSubmission, status: 'IN_REVIEW', version: 5 };
    mocks.getGradingSubmission.mockReset();
    mocks.getGradingSubmission.mockResolvedValueOnce(mixedSubmission).mockResolvedValue(claimedMixedSubmission);
    renderPage();
    await waitFor(() => expect(mocks.claimGradingSubmission).toHaveBeenCalledWith('submission-1'));

    const lecturerScore = screen.getByRole('spinbutton', { name: 'Điểm giảng viên câu 1' });
    await waitFor(() => expect(lecturerScore).toBeEnabled());
    fireEvent.change(lecturerScore, { target: { value: '3' } });
    expect(screen.getByText('4,00')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Lưu điểm giảng viên' }));
    await waitFor(() => expect(mocks.saveGradingScores).toHaveBeenCalledWith('submission-1', 5, [{
      questionId: 'question-1', criterionId: 'criterion-1', score: 3, maxScore: 4,
      source: 'MANUAL', overrideReason: null, comment: null,
    }], ['question-2']));
  });

  it('lets the lecturer retry a failed AI run and refreshes the submission', async () => {
    const failedSubmission = { ...submission('AI_FAILED'), aiStatus: 'FAILED' };
    mocks.getGradingSubmission.mockReset();
    mocks.getGradingSubmission.mockResolvedValue(failedSubmission);
    mocks.enqueueGradingAiRun.mockResolvedValue({});
    renderPage();

    const retryButton = await screen.findByRole('button', { name: 'Thử chấm AI lại' });
    await waitFor(() => expect(retryButton).toBeEnabled());
    fireEvent.click(retryButton);
    await waitFor(() => expect(mocks.enqueueGradingAiRun).toHaveBeenCalledWith('submission-1'));
    await waitFor(() => expect(mocks.getGradingSubmission).toHaveBeenLastCalledWith('submission-1'));
  });

  it('displays the Bloom-weighted maximum under AI and saves the question scores', async () => {
    const twoQuestionSubmission = {
      ...submission('AI_PENDING'),
      turns: [
        { turnId: 'turn-1', questionId: 'question-1', turnOrder: 1, turnType: 'MAIN', bloomLevel: 'REMEMBER', questionText: 'Easy question', transcriptText: 'Answer', normalizedText: null, needsHumanReview: false },
        { turnId: 'turn-2', questionId: 'question-2', turnOrder: 2, turnType: 'MAIN', bloomLevel: 'APPLY', questionText: 'Medium question', transcriptText: 'Answer', normalizedText: null, needsHumanReview: false },
        { turnId: 'turn-3', questionId: 'question-3', turnOrder: 3, turnType: 'MAIN', bloomLevel: 'CREATE', questionText: 'Hard question', transcriptText: 'Answer', normalizedText: null, needsHumanReview: false },
      ],
      questionMaxScores: { 'question-1': 2, 'question-2': 3, 'question-3': 5 },
    };
    const claimedTwoQuestionSubmission = { ...twoQuestionSubmission, status: 'IN_REVIEW', version: 5 };
    mocks.getGradingSubmission.mockReset();
    mocks.getGradingSubmission.mockResolvedValueOnce(twoQuestionSubmission).mockResolvedValue(claimedTwoQuestionSubmission);
    renderPage();
    await waitFor(() => expect(mocks.claimGradingSubmission).toHaveBeenCalledWith('submission-1'));
    expect(screen.getByText((_, element) => element?.textContent === 'Tối đa 2,00 điểm')).toBeInTheDocument();
    expect(screen.getByText('Bloom · Nhớ')).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === 'Tối đa 3,00 điểm')).toBeInTheDocument();
    expect(screen.getByText('Bloom · Vận dụng')).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === 'Tối đa 5,00 điểm')).toBeInTheDocument();
    expect(screen.getByText('Bloom · Sáng tạo')).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton', { name: /Điểm tối đa câu/ })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('spinbutton', { name: 'Điểm giảng viên câu 1' })).toBeEnabled());
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Điểm giảng viên câu 1' }), { target: { value: '01' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Điểm giảng viên câu 2' }), { target: { value: '1' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Điểm giảng viên câu 2' }), { target: { value: '2' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Điểm giảng viên câu 3' }), { target: { value: '4' } });
    expect(screen.getByText('7,00')).toBeInTheDocument();
    expect(screen.getByText('/ 10,00')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Lưu điểm giảng viên' }));

    await waitFor(() => expect(mocks.saveGradingScores).toHaveBeenCalledWith('submission-1', 5, [
      { questionId: 'question-1', criterionId: 'criterion-1', score: 1, maxScore: 2, source: 'MANUAL', overrideReason: null, comment: null },
      { questionId: 'question-2', criterionId: 'criterion-1', score: 2, maxScore: 3, source: 'MANUAL', overrideReason: null, comment: null },
      { questionId: 'question-3', criterionId: 'criterion-1', score: 4, maxScore: 5, source: 'MANUAL', overrideReason: null, comment: null },
    ], []));
  });

  it('disables score entry and explains when Bloom allocation is missing', async () => {
    const missingAllocation = {
      ...submission('AI_PENDING'),
      questionMaxScores: {},
    };
    mocks.getGradingSubmission.mockReset();
    mocks.getGradingSubmission.mockResolvedValueOnce(missingAllocation)
      .mockResolvedValue({ ...missingAllocation, status: 'IN_REVIEW', version: 5 });
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Chưa xác định được điểm tối đa theo Bloom');
    const score = screen.getByRole('spinbutton', { name: 'Điểm giảng viên câu 1' });
    await waitFor(() => expect(score).toBeDisabled());
  });

  it('accepts screenshot-like decimal scores within Bloom maxima across weighted criteria', async () => {
    const weightedSubmission = {
      ...submission('AI_PENDING'),
      turns: [
        { turnId: 'turn-1', questionId: 'question-1', turnOrder: 1, turnType: 'MAIN', bloomLevel: 'REMEMBER', questionText: 'Question 1', transcriptText: 'Answer', normalizedText: null, needsHumanReview: false },
        { turnId: 'turn-2', questionId: 'question-2', turnOrder: 2, turnType: 'MAIN', bloomLevel: 'UNDERSTAND', questionText: 'Question 2', transcriptText: 'Answer', normalizedText: null, needsHumanReview: false },
        { turnId: 'turn-3', questionId: 'question-3', turnOrder: 3, turnType: 'MAIN', bloomLevel: 'APPLY', questionText: 'Question 3', transcriptText: 'Answer', normalizedText: null, needsHumanReview: false },
      ],
      rubricCriteria: [
        { criterionId: 'criterion-1', name: 'Correctness', expectedPoints: '', weight: 0.3 },
        { criterionId: 'criterion-2', name: 'Accuracy', expectedPoints: '', weight: 0.5 },
        { criterionId: 'criterion-3', name: 'Evidence', expectedPoints: '', weight: 0.2 },
      ],
      questionMaxScores: { 'question-1': 2.87, 'question-2': 2.85, 'question-3': 4.28 },
    };
    mocks.getGradingSubmission.mockReset();
    mocks.getGradingSubmission.mockResolvedValueOnce(weightedSubmission)
      .mockResolvedValue({ ...weightedSubmission, status: 'IN_REVIEW', version: 5 });
    renderPage();
    await waitFor(() => expect(mocks.claimGradingSubmission).toHaveBeenCalledWith('submission-1'));
    await waitFor(() => expect(screen.getByRole('spinbutton', { name: 'Điểm giảng viên câu 2' })).toBeEnabled());

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Điểm giảng viên câu 1' }), { target: { value: '1' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Điểm giảng viên câu 2' }), { target: { value: '0.98' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Điểm giảng viên câu 3' }), { target: { value: '1' } });
    expect(screen.getByText('2,98')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Lưu điểm giảng viên' }));

    await waitFor(() => expect(mocks.saveGradingScores).toHaveBeenCalledWith('submission-1', 5, [
      { questionId: 'question-1', criterionId: 'criterion-1', score: 0.3, maxScore: 0.861, source: 'MANUAL', overrideReason: null, comment: null },
      { questionId: 'question-1', criterionId: 'criterion-2', score: 0.5, maxScore: 1.435, source: 'MANUAL', overrideReason: null, comment: null },
      { questionId: 'question-1', criterionId: 'criterion-3', score: 0.2, maxScore: 0.574, source: 'MANUAL', overrideReason: null, comment: null },
      { questionId: 'question-2', criterionId: 'criterion-1', score: 0.294, maxScore: 0.855, source: 'MANUAL', overrideReason: null, comment: null },
      { questionId: 'question-2', criterionId: 'criterion-2', score: 0.49, maxScore: 1.425, source: 'MANUAL', overrideReason: null, comment: null },
      { questionId: 'question-2', criterionId: 'criterion-3', score: 0.196, maxScore: 0.57, source: 'MANUAL', overrideReason: null, comment: null },
      { questionId: 'question-3', criterionId: 'criterion-1', score: 0.3, maxScore: 1.284, source: 'MANUAL', overrideReason: null, comment: null },
      { questionId: 'question-3', criterionId: 'criterion-2', score: 0.5, maxScore: 2.14, source: 'MANUAL', overrideReason: null, comment: null },
      { questionId: 'question-3', criterionId: 'criterion-3', score: 0.2, maxScore: 0.856, source: 'MANUAL', overrideReason: null, comment: null },
    ]));
    expect(screen.queryByText(/vượt giới hạn|điểm phải từ/i)).not.toBeInTheDocument();
  });

  it('clears a stale validation error when the lecturer corrects the score', async () => {
    renderPage();
    const score = await screen.findByRole('spinbutton', { name: 'Điểm giảng viên câu 1' });
    await waitFor(() => expect(score).toBeEnabled());

    fireEvent.change(score, { target: { value: '11' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu điểm giảng viên' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Câu 1: điểm phải từ 0 đến 10,00.');

    fireEvent.change(score, { target: { value: '8' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Lưu điểm giảng viên' }));
    await waitFor(() => expect(mocks.saveGradingScores).toHaveBeenCalled());
  });
});
