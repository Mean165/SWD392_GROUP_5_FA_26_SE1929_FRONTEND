import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../context/LanguageContext';
import type { InteractionTurnResponse } from '../../types/interview';
import InterviewRoom from './InterviewRoom';

vi.mock('./AudioPlayer', () => ({ default: ({ turnId }: { turnId: string }) => <button>Read {turnId}</button> }));
vi.mock('./AnswerRecorder', () => ({ default: ({ turnId }: { turnId: string }) => <button>Record {turnId}</button> }));

const makeTurn = (turnId: string, turnOrder: number): InteractionTurnResponse => ({
  turnId,
  attemptId: 'attempt-1',
  mainQuestionId: `question-${turnOrder}`,
  turnOrder,
  turnType: 'MAIN',
  aiQuestionText: `Question ${turnOrder}`,
  transcriptText: turnOrder === 1 ? 'Previously submitted' : null,
  audioSegmentUrl: null,
  createdAt: '',
});

describe('InterviewRoom per-turn controls', () => {
  it('keeps question playback with each turn and recording with only the active turn', () => {
    render(<LanguageProvider><InterviewRoom
      turns={[makeTurn('turn-1', 1), makeTurn('turn-2', 2)]}
      questionPlan={[{ questionId: 'question-1', position: 1, bloomLevel: 'REMEMBER', questionText: 'Question 1' }, { questionId: 'question-2', position: 2, bloomLevel: 'APPLY', questionText: 'Question 2' }]}
      activeTurnId="turn-2"
      examAttemptId="exam-attempt-1"
      isSubmitting={false}
      submitError={null}
      onSubmit={vi.fn()}
      onDiscard={vi.fn()}
    /></LanguageProvider>);

    expect(screen.getAllByRole('button', { name: 'Đọc câu hỏi' })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Ghi âm khi đến lượt' })).not.toBeInTheDocument();
  });
});
