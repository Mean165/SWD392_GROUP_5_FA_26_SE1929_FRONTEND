import AudioPlayer from './AudioPlayer';
import AnswerRecorder from './AnswerRecorder';
import InterviewQuestion from './InterviewQuestion';
import type { InteractionTurnResponse } from '../../types/interview';

interface InterviewRoomProps {
  turn: InteractionTurnResponse;
  confirmedTranscript: string | null;
  recordingAvailable: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  onRecordingReady: (dataUrl: string) => void;
  onSubmit: () => void;
  onDiscard: () => void;
}

export default function InterviewRoom({
  turn,
  confirmedTranscript,
  recordingAvailable,
  isSubmitting,
  submitError,
  onRecordingReady,
  onSubmit,
  onDiscard,
}: InterviewRoomProps) {
  return (
    <div className="interview-room">
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
        isSubmitting={isSubmitting}
        submitError={submitError}
        onRecordingReady={onRecordingReady}
        onSubmit={onSubmit}
        onDiscard={onDiscard}
      />
    </div>
  );
}
