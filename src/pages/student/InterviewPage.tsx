import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import InterviewRoom from '../../components/interview/InterviewRoom';
import { APP_ROUTES } from '../../constants/routes';
import {
  getInterview,
  getInterviewErrorMessage,
  getInterviewErrorStatus,
  startInterview,
  submitAnswer,
} from '../../services/interview/interviewService';
import type { InterviewResponse, InteractionTurnResponse } from '../../types/interview';
import { StudentPageHeader } from './StudentPages';
import './InterviewPage.css';

const UUID_PATTERN = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

interface RecordedAnswer {
  turnId: string;
  audioDataUrl: string;
}

export default function InterviewPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isSessionRoute = /\/student\/exams\/[^/]+\/room\/?$/.test(location.pathname);
  const [attempt, setAttempt] = useState<InterviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recordedAnswer, setRecordedAnswer] = useState<RecordedAnswer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedTranscript, setConfirmedTranscript] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const submitLockRef = useRef<string | null>(null);
  const routeKeyRef = useRef(location.pathname);
  routeKeyRef.current = location.pathname;

  const loadAttempt = async (signal?: AbortSignal) => {
    if (!id || !UUID_PATTERN.test(id)) {
      throw new Error('Mã phiên thi không hợp lệ.');
    }
    return isSessionRoute ? startInterview(id, signal) : getInterview(id, signal);
  };

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setAttempt(null);
    setLoadError(null);
    setRecordedAnswer(null);
    setIsSubmitting(false);
    setSubmitError(null);
    setConfirmedTranscript(null);
    setCompleted(false);

    loadAttempt(controller.signal)
      .then((response) => {
        if (!active) return;
        setAttempt(response);
        setCompleted(response.status === 'COMPLETED');
      })
      .catch((error: unknown) => {
        if (!active || controller.signal.aborted) return;
        setLoadError(getInterviewErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [id, isSessionRoute, location.pathname]);

  const currentTurn: InteractionTurnResponse | null = attempt?.currentTurn ?? null;

  const handleRecordingReady = (audioDataUrl: string) => {
    if (!currentTurn) return;
    setRecordedAnswer({ turnId: currentTurn.turnId, audioDataUrl });
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (submitLockRef.current === location.pathname || isSubmitting || !attempt || !currentTurn) return;
    if (!recordedAnswer || recordedAnswer.turnId !== currentTurn.turnId) {
      setSubmitError('Hãy tạo bản ghi hợp lệ cho câu hỏi hiện tại trước khi gửi.');
      return;
    }

    const submitAttemptId = attempt.attemptId;
    const submitTurnId = currentTurn.turnId;
    const submitRoute = location.pathname;
    submitLockRef.current = submitRoute;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await submitAnswer({
        attemptId: submitAttemptId,
        turnId: submitTurnId,
        audioSegmentUrl: recordedAnswer.audioDataUrl,
      });
      if (routeKeyRef.current !== submitRoute) return;
      if (response.turnId !== submitTurnId) {
        setLoadError('Máy chủ trả về lượt thi không khớp. Hãy tải lại trạng thái phiên thi trước khi tiếp tục.');
        return;
      }

      setConfirmedTranscript(response.transcriptText);
      setRecordedAnswer(null);
      setSubmitError(null);

      if (response.completed) {
        setAttempt({ ...attempt, status: 'COMPLETED', currentTurn: null });
        setCompleted(true);
      } else if (response.nextTurn) {
        setAttempt({ ...attempt, status: 'IN_PROGRESS', currentTurn: response.nextTurn });
      } else {
        setAttempt({ ...attempt, currentTurn: null });
        try {
          const refreshed = await getInterview(submitAttemptId);
          if (routeKeyRef.current !== submitRoute) return;
          setAttempt(refreshed);
          setCompleted(refreshed.status === 'COMPLETED');
        } catch {
          if (routeKeyRef.current === submitRoute) {
            setLoadError('Câu trả lời đã được máy chủ xác nhận, nhưng không tải được lượt tiếp theo. Tải lại trạng thái phiên thi để tiếp tục.');
          }
        }
      }
    } catch (error) {
      if (routeKeyRef.current === submitRoute) {
        const message = getInterviewErrorMessage(error, 'submit');
        if (getInterviewErrorStatus(error) === 404 || getInterviewErrorStatus(error) === 410) {
          setLoadError(message);
        } else {
          setSubmitError(message);
        }
      }
    } finally {
      if (submitLockRef.current === submitRoute) submitLockRef.current = null;
      if (routeKeyRef.current === submitRoute) setIsSubmitting(false);
    }
  };

  const reloadAttempt = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await loadAttempt();
      setAttempt(response);
      setCompleted(response.status === 'COMPLETED');
      setConfirmedTranscript(null);
    } catch (error) {
      setLoadError(getInterviewErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const title = isSessionRoute ? 'Phòng thi vấn đáp AI' : 'Phiên thi vấn đáp AI';

  return (
    <div className="student-page">
      <StudentPageHeader
        title={title}
        description={id ? `Phiên thi ${id}` : 'Không tìm thấy mã phiên thi.'}
        action={{ label: 'Quay lại lịch thi', to: APP_ROUTES.student.exams }}
      />

      {loading && <p className="interview-page-status" role="status">Đang tải trạng thái phiên thi…</p>}

      {!loading && loadError && (
        <section className="interview-state-card" role="alert">
          <p>{loadError}</p>
          {recordedAnswer && (
            <p>Bản ghi vẫn được giữ trong trang này và chưa được tự gửi lại.</p>
          )}
          {confirmedTranscript !== null && (
            <div className="interview-transcript">
              <h3>Phiên âm đã được máy chủ xác nhận</h3>
              <p>{confirmedTranscript || 'Máy chủ không trả về nội dung phiên âm.'}</p>
            </div>
          )}
          <button type="button" className="student-primary-button" onClick={reloadAttempt}>
            Tải lại trạng thái phiên thi
          </button>
        </section>
      )}

      {!loading && !loadError && completed && (
        <section className="interview-state-card interview-completed" role="status">
          <h2>Phiên thi đã hoàn tất</h2>
          <p>Máy chủ đã xác nhận trạng thái hoàn tất của phiên thi này.</p>
          {confirmedTranscript !== null && (
            <div className="interview-transcript">
              <h3>Phiên âm đã được máy chủ xác nhận</h3>
              <p>{confirmedTranscript || 'Máy chủ không trả về nội dung phiên âm.'}</p>
            </div>
          )}
        </section>
      )}

      {!loading && !loadError && !completed && attempt && currentTurn && (
        <InterviewRoom
          turn={currentTurn}
          confirmedTranscript={confirmedTranscript}
          recordingAvailable={recordedAnswer?.turnId === currentTurn.turnId}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onRecordingReady={handleRecordingReady}
          onSubmit={handleSubmit}
          onDiscard={() => {
            setRecordedAnswer(null);
            setSubmitError(null);
          }}
        />
      )}

      {!loading && !loadError && !completed && attempt && !currentTurn && (
        <section className="interview-state-card" role="status">
          <h2>Chưa có câu hỏi hiện tại</h2>
          <p>Máy chủ chưa cung cấp lượt hỏi có thể trả lời. Hãy tải lại trạng thái phiên thi hoặc liên hệ hỗ trợ.</p>
          <button type="button" className="student-primary-button" onClick={reloadAttempt}>
            Tải lại trạng thái phiên thi
          </button>
        </section>
      )}

      <p className="interview-support-link">
        <Link to={APP_ROUTES.student.help}>Cần trợ giúp về micro hoặc kết nối?</Link>
      </p>
    </div>
  );
}
