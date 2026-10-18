import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import InterviewPage from './InterviewPage';
import type { InterviewResponse, InteractionTurnResponse, SubmitAnswerResponse } from '../../types/interview';

const interviewMocks = vi.hoisted(() => ({
  getInterview: vi.fn(),
  startInterview: vi.fn(),
  submitAnswer: vi.fn(),
  getInterviewErrorStatus: vi.fn(),
  getInterviewErrorMessage: vi.fn((error: unknown) => error instanceof Error ? error.message : 'API error'),
}));
const ATTEMPT_ID = '11111111-1111-4111-8111-111111111111';
const TURN_ID = '22222222-2222-4222-8222-222222222222';

vi.mock('../../services/interview/interviewService', () => interviewMocks);
vi.mock('../../components/interview/AudioPlayer', () => ({ default: () => null }));
vi.mock('../../components/interview/AnswerRecorder', () => ({
  default: (props: {
    recordingAvailable: boolean;
    isSubmitting: boolean;
    onRecordingReady: (dataUrl: string) => void;
    onSubmit: () => void;
    onDiscard: () => void;
  }) => (
    <section>
      <button type="button" onClick={() => props.onRecordingReady('data:audio/webm;base64,dm9pY2U=')}>
        Test recording ready
      </button>
      <button type="button" onClick={props.onSubmit}>Test submit</button>
      <button type="button" onClick={props.onDiscard}>Test discard</button>
      <p role="status">{props.isSubmitting ? 'Đang gửi và xử lý câu trả lời.' : ''}</p>
      <span>{props.recordingAvailable ? 'Bản ghi đã sẵn sàng.' : ''}</span>
    </section>
  ),
}));

const currentTurn: InteractionTurnResponse = {
  turnId: TURN_ID,
  attemptId: ATTEMPT_ID,
  mainQuestionId: '33333333-3333-4333-8333-333333333333',
  turnOrder: 1,
  turnType: 'MAIN',
  aiQuestionText: 'Câu hỏi từ máy chủ ban đầu',
  transcriptText: null,
  audioSegmentUrl: null,
  aiReasoning: null,
  createdAt: '2026-10-18T00:00:00Z',
};

const makeInterview = (turn: InteractionTurnResponse | null = currentTurn): InterviewResponse => ({
  attemptId: ATTEMPT_ID,
  assignmentId: '55555555-5555-4555-8555-555555555555',
  sessionId: '66666666-6666-4666-8666-666666666666',
  studentId: '77777777-7777-4777-8777-777777777777',
  status: 'IN_PROGRESS',
  startTime: null,
  endTime: null,
  currentTurn: turn,
  turns: [],
});

const nextTurn: InteractionTurnResponse = {
  ...currentTurn,
  turnId: '44444444-4444-4444-8444-444444444444',
  turnOrder: 2,
  turnType: 'FOLLOW_UP',
  aiQuestionText: 'Câu hỏi tiếp nối đúng từ response backend',
};

const renderAttemptRoute = () => render(
  <MemoryRouter
    initialEntries={[`/student/interview/${ATTEMPT_ID}`]}
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
  >
    <Routes>
      <Route path="/student/interview/:id" element={<InterviewPage />} />
    </Routes>
  </MemoryRouter>,
);

afterEach(() => {
  vi.clearAllMocks();
});

describe('InterviewPage', () => {
  it('loads the route attemptId and displays only transcript and next turn returned by the backend', async () => {
    interviewMocks.getInterview.mockResolvedValue(makeInterview());
    let resolveSubmit: (response: SubmitAnswerResponse) => void = () => undefined;
    interviewMocks.submitAnswer.mockImplementation(() => new Promise((resolve) => {
      resolveSubmit = resolve;
    }));
    renderAttemptRoute();

    expect(await screen.findByText('Câu hỏi từ máy chủ ban đầu')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Test recording ready' }));
    fireEvent.click(screen.getByRole('button', { name: 'Test submit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Test submit' }));

    await waitFor(() => expect(interviewMocks.submitAnswer).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Đang gửi và xử lý câu trả lời.')).toBeInTheDocument();
    expect(interviewMocks.submitAnswer).toHaveBeenCalledWith({
      attemptId: ATTEMPT_ID,
      turnId: TURN_ID,
      audioSegmentUrl: 'data:audio/webm;base64,dm9pY2U=',
    });

    resolveSubmit({
      turnId: TURN_ID,
      transcriptText: 'Phiên âm do backend trả về',
      completed: false,
      followUpGenerated: true,
      nextTurn,
      answerClassification: 'CORRECT',
      analysisSummary: 'Không hiển thị nội bộ',
      assessments: [],
    });

    expect(await screen.findByText('Phiên âm do backend trả về')).toBeInTheDocument();
    expect(await screen.findByText('Câu hỏi tiếp nối đúng từ response backend')).toBeInTheDocument();
    expect(screen.queryByText('Không hiển thị nội bộ')).not.toBeInTheDocument();
  });

  it('starts or resumes from the sessionId route, not a fabricated attempt id', async () => {
    interviewMocks.startInterview.mockResolvedValue(makeInterview());
    render(
      <MemoryRouter
        initialEntries={['/student/exams/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/room']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/student/exams/:id/room" element={<InterviewPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Câu hỏi từ máy chủ ban đầu')).toBeInTheDocument();
    expect(interviewMocks.startInterview).toHaveBeenCalledWith('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', expect.any(AbortSignal));
    expect(interviewMocks.getInterview).not.toHaveBeenCalled();
  });
});
