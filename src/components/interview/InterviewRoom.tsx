import AnswerRecorder from './AnswerRecorder';
import InterviewQuestion from './InterviewQuestion';
import QuestionReadButton from './QuestionReadButton';
import type { InteractionTurnResponse, PlannedQuestionResponse } from '../../types/interview';
import { useLanguage } from '../../context/LanguageContext';

interface InterviewRoomProps {
  turns: InteractionTurnResponse[];
  questionPlan: PlannedQuestionResponse[];
  activeTurnId: string;
  examAttemptId: string;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (transcriptText: string) => void;
  onDiscard: () => void;
}

export default function InterviewRoom({
  turns,
  questionPlan,
  activeTurnId,
  examAttemptId,
  isSubmitting,
  submitError,
  onSubmit,
  onDiscard,
}: InterviewRoomProps) {
  const { t } = useLanguage();
  const activeTurn = turns.find((turn) => turn.turnId === activeTurnId) ?? null;
  const plannedQuestionIds = new Set(questionPlan.map((question) => question.questionId));
  const extraTurns = turns.filter((turn) => !plannedQuestionIds.has(turn.mainQuestionId)
    || turn.turnType === 'FOLLOW_UP');

  const renderRecorder = (turn: InteractionTurnResponse, active: boolean) => active
    ? <AnswerRecorder
        key={`recorder-${turn.turnId}`}
        examAttemptId={examAttemptId}
        turnId={turn.turnId}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={onSubmit}
        onDiscard={onDiscard}
      />
    : turn.transcriptText
      ? <p className="interview-turn-submitted" role="status">{t('Đã gửi câu trả lời')}</p>
      : <p className="interview-turn-waiting" role="status">{t('Ghi âm sẽ mở khi đến lượt câu hỏi này.')}</p>;

  return (
    <div className="interview-turn-list" aria-label={t('Các câu hỏi trong phiên thi')}>
      {questionPlan.map((question) => {
        const turn = turns.find((item) => item.mainQuestionId === question.questionId && item.turnType === 'MAIN') ?? null;
        const isActive = Boolean(turn && turn.turnId === activeTurnId);
        const titleId = `interview-question-${question.questionId}`;
        return (
          <article className={`interview-turn-card${isActive ? ' active' : ''}`} key={question.questionId}>
            <div className="interview-question-plan-meta">
              <span>{t('Câu')} {question.position}</span>
              <span>{t('Mức')} {question.bloomLevel}</span>
              {isActive && <strong>{t('Câu hiện tại')}</strong>}
            </div>
            <section className="interview-question" aria-labelledby={titleId}>
              <h2 id={titleId}>{question.questionText}</h2>
            </section>
            <div className="interview-turn-actions"><QuestionReadButton text={question.questionText} /></div>
            {turn ? renderRecorder(turn, isActive) : <>
              <button type="button" className="student-primary-button" disabled>{t('Ghi âm khi đến lượt')}</button>
              <p className="interview-turn-waiting" role="status">{t('Ghi âm sẽ mở khi đến lượt câu hỏi này.')}</p>
            </>}
          </article>
        );
      })}
      {extraTurns.map((turn) => {
        const active = turn.turnId === activeTurn?.turnId;
        const titleId = `interview-turn-${turn.turnId}`;
        return <article className={`interview-turn-card${active ? ' active' : ''}`} key={turn.turnId}>
          <InterviewQuestion turn={turn} titleId={titleId} />
          <div className="interview-turn-actions"><QuestionReadButton text={turn.aiQuestionText} /></div>
          {renderRecorder(turn, active)}
        </article>;
      })}
    </div>
  );
}
