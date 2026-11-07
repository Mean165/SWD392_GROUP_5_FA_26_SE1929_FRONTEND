import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from '../../context/LanguageContext';
import InterviewPage from './InterviewPage';
import type { InterviewResponse, InteractionTurnResponse } from '../../types/interview';

const mocks = vi.hoisted(() => ({ getInterview: vi.fn(), startInterview: vi.fn(), submitAnswer: vi.fn(), getInterviewErrorStatus: vi.fn(), getInterviewErrorMessage: vi.fn((e: unknown) => e instanceof Error ? e.message : 'API error') }));
const ATTEMPT_ID = '11111111-1111-4111-8111-111111111111';
const EXAM_ATTEMPT_ID = '99999999-9999-4999-8999-999999999999';
const TURN_ID = '22222222-2222-4222-8222-222222222222';
vi.mock('../../services/interview/interviewService', () => mocks);
vi.mock('../../components/interview/AudioPlayer', () => ({ default: () => null }));
vi.mock('../../components/interview/AnswerRecorder', () => ({ default: (props: { examAttemptId: string; turnId: string; onSubmit: (transcript: string) => void }) => <button onClick={() => props.onSubmit('Recognized answer')}>Simulate EXAM ended</button> }));

const turn: InteractionTurnResponse = { turnId: TURN_ID, attemptId: ATTEMPT_ID, mainQuestionId: '33333333-3333-4333-8333-333333333333', turnOrder: 1, turnType: 'MAIN', aiQuestionText: 'Question from backend', transcriptText: null, audioSegmentUrl: null, createdAt: '2026-11-04T00:00:00Z' };
const nextTurn: InteractionTurnResponse = { ...turn, turnId: '88888888-8888-4888-8888-888888888888', mainQuestionId: '44444444-4444-4444-8444-444444444444', turnOrder: 2, aiQuestionText: 'Next question from backend' };
const interview = (currentTurn: InteractionTurnResponse | null = turn, turns: InteractionTurnResponse[] = []): InterviewResponse => ({ attemptId: ATTEMPT_ID, examAttemptId: EXAM_ATTEMPT_ID, attemptNo: 1, assignmentId: '55555555-5555-4555-8555-555555555555', sessionId: '66666666-6666-4666-8666-666666666666', studentId: '77777777-7777-4777-8777-777777777777', status: 'IN_PROGRESS', startTime: null, endTime: null, currentTurn, turns, questionPlan: [
  { questionId: turn.mainQuestionId, position: 1, bloomLevel: 'REMEMBER', questionText: 'First selected question' },
  { questionId: '44444444-4444-4444-8444-444444444444', position: 2, bloomLevel: 'UNDERSTAND', questionText: 'Second selected question' },
] });

const renderAttempt = () => render(<LanguageProvider><MemoryRouter initialEntries={[`/student/interview/${ATTEMPT_ID}`]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes><Route path="/student/interview/:id" element={<InterviewPage />} /></Routes></MemoryRouter></LanguageProvider>);
afterEach(() => vi.clearAllMocks());

describe('InterviewPage WebSocket completion flow', () => {
  it('refreshes the server state after WebSocket confirms answer processing', async () => {
    mocks.getInterview.mockResolvedValueOnce(interview()).mockResolvedValueOnce(interview()).mockResolvedValueOnce(interview(nextTurn, [{ ...turn, transcriptText: 'Recognized answer' }, nextTurn]));
    mocks.submitAnswer.mockResolvedValue({ turnId: TURN_ID, transcriptText: 'Recognized answer', completed: false, followUpGenerated: false, nextTurn });
    renderAttempt();
    expect(await screen.findByText('First selected question')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Simulate EXAM ended' }));
    expect(await screen.findByText('Second selected question')).toBeInTheDocument();
    expect(mocks.submitAnswer).toHaveBeenCalledWith({ attemptId: ATTEMPT_ID, turnId: TURN_ID, transcriptText: 'Recognized answer', language: 'vi' });
    expect(mocks.getInterview).toHaveBeenCalledTimes(3);
  });

  it('starts the interview through the session route', async () => {
    mocks.startInterview.mockResolvedValue(interview());
    render(<LanguageProvider><MemoryRouter initialEntries={[`/student/exams/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/room?examAttemptId=${EXAM_ATTEMPT_ID}`]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes><Route path="/student/exams/:id/room" element={<InterviewPage />} /></Routes></MemoryRouter></LanguageProvider>);
    expect(await screen.findByText('First selected question')).toBeInTheDocument();
    expect(mocks.startInterview).toHaveBeenCalledWith(EXAM_ATTEMPT_ID, expect.any(AbortSignal));
  });

  it('shows the entire planned question list as separate cards', async () => {
    mocks.getInterview.mockResolvedValue(interview());
    renderAttempt();

    expect(await screen.findByText('First selected question')).toBeInTheDocument();
    expect(screen.getByText('First selected question')).toBeInTheDocument();
    expect(screen.getByText('Second selected question')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Đọc câu hỏi' })).toHaveLength(2);
  });
});
