import type { InteractionTurnResponse } from '../../types/interview';

interface InterviewQuestionProps {
  turn: InteractionTurnResponse;
}

export default function InterviewQuestion({ turn }: InterviewQuestionProps) {
  const isFollowUp = turn.turnType === 'FOLLOW_UP';
  return (
    <section className="interview-question" aria-labelledby="current-question-title">
      <p className="interview-question-kicker">
        {isFollowUp ? 'Câu hỏi tiếp nối' : 'Câu hỏi hiện tại'} · Lượt {turn.turnOrder}
      </p>
      <h2 id="current-question-title">{turn.aiQuestionText}</h2>
    </section>
  );
}
