import type { InteractionTurnResponse } from '../../types/interview';
import { useLanguage } from '../../context/LanguageContext';

interface InterviewQuestionProps {
  turn: InteractionTurnResponse;
  titleId: string;
}

export default function InterviewQuestion({ turn, titleId }: InterviewQuestionProps) {
  const { t } = useLanguage();
  const isFollowUp = turn.turnType === 'FOLLOW_UP';
  return (
    <section className="interview-question" aria-labelledby={titleId}>
      <p className="interview-question-kicker">
        {t(isFollowUp ? 'Câu hỏi tiếp nối' : 'Câu hỏi hiện tại')} · {t('Lượt')} {turn.turnOrder}
      </p>
      <h2 id={titleId}>{turn.aiQuestionText}</h2>
    </section>
  );
}
