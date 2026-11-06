import AudioPlayer from './AudioPlayer';
import AnswerRecorder from './AnswerRecorder';
import InterviewQuestion from './InterviewQuestion';
import type { InteractionTurnResponse, PlannedQuestionResponse } from '../../types/interview';
import { useLanguage } from '../../context/LanguageContext';

interface InterviewRoomProps {
  turn: InteractionTurnResponse;
  questionPlan?: PlannedQuestionResponse[];
  examAttemptId: string;
  confirmedTranscript: string | null;
  recordingAvailable: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
  onDiscard: () => void;
}

export default function InterviewRoom({
  turn,
  questionPlan = [],
  examAttemptId,
  confirmedTranscript,
  recordingAvailable,
  isSubmitting,
  submitError,
  onSubmit,
  onDiscard,
}: InterviewRoomProps) {
  const { t } = useLanguage();
  return (
    <div className="interview-room">
      {questionPlan.length > 0 && (
        <section className="interview-question-plan" aria-labelledby="question-plan-title">
          <h2 id="question-plan-title">{t('Câu hỏi đã chọn')} ({questionPlan.length})</h2>
          <ol>
            {questionPlan.map((question) => (
              <li key={question.questionId} aria-current={question.questionId === turn.mainQuestionId ? 'step' : undefined}>
                <div className="interview-question-plan-meta">
                  <span>{t('Câu')} {question.position}</span>
                  <span>{t('Mức')} {question.bloomLevel}</span>
                  {question.questionId === turn.mainQuestionId && <strong>{t('Câu hiện tại')}</strong>}
                </div>
                <p>{question.questionText}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
      <InterviewQuestion turn={turn} />
      <AudioPlayer key={turn.turnId} turnId={turn.turnId} />
      {confirmedTranscript !== null && (
        <section className="interview-transcript" aria-labelledby="confirmed-transcript-title">
          <h3 id="confirmed-transcript-title">Phiên âm đã được máy chủ xác nhận</h3>
          <p>{confirmedTranscript || 'Máy chủ không trả về nội dung phiên âm.'}</p>
        </section>
      )}
      <AnswerRecorder
        key={`recorder-${turn.turnId}`}
        recordingAvailable={recordingAvailable}
        examAttemptId={examAttemptId}
        turnId={turn.turnId}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={onSubmit}
        onDiscard={onDiscard}
      />
    </div>
  );
}
