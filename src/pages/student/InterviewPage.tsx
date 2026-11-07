import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import InterviewRoom from '../../components/interview/InterviewRoom';
import { APP_ROUTES } from '../../constants/routes';
import {
  getInterview,
  getInterviewErrorMessage,
  getInterviewErrorStatus,
  abandonInterview,
  startInterview,
  submitAnswer,
} from '../../services/interview/interviewService';
import type { InterviewResponse, InteractionTurnResponse } from '../../types/interview';
import { useLanguage } from '../../context/LanguageContext';
import { StudentPageHeader } from './StudentPages';
import './InterviewPage.css';

const UUID_PATTERN = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

export default function InterviewPage() {
  const { t, language } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isSessionRoute = /\/student\/exams\/[^/]+\/room\/?$/.test(location.pathname);
  const examAttemptId = new URLSearchParams(location.search).get('examAttemptId');
  const [attempt, setAttempt] = useState<InterviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [abandoning, setAbandoning] = useState(false);
  const submitLockRef = useRef<string | null>(null);
  const routeKeyRef = useRef(location.pathname);
  routeKeyRef.current = location.pathname;

  const loadAttempt = async (signal?: AbortSignal) => {
    if (!id || !UUID_PATTERN.test(id)) {
      throw new Error(t('Mã phiên thi không hợp lệ.'));
    }
    return isSessionRoute ? (examAttemptId ? startInterview(examAttemptId, signal) : Promise.reject(new Error(t('Không tìm thấy lượt thi được cấp. Hãy tải lại lịch thi.')))) : getInterview(id, signal);
  };

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setAttempt(null);
    setLoadError(null);
    setIsSubmitting(false);
    setSubmitError(null);
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
  }, [id, isSessionRoute, location.pathname, location.search]);

  const currentTurn: InteractionTurnResponse | null = attempt?.currentTurn ?? null;
  const interviewTurns = attempt?.turns ?? [];
  const visibleTurns = currentTurn && !interviewTurns.some((turn) => turn.turnId === currentTurn.turnId)
    ? [...interviewTurns, currentTurn]
    : interviewTurns;

  const handleSubmit = async (transcriptText: string) => {
    if (submitLockRef.current === location.pathname || isSubmitting || !attempt || !currentTurn) return;
    if (!transcriptText.trim()) {
      setSubmitError(t('Chưa nhận diện được giọng nói. Hãy nói rõ hơn rồi thử lại.'));
      return;
    }

    const submitAttemptId = attempt.attemptId;
    const submitRoute = location.pathname;
    submitLockRef.current = submitRoute;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let response = await getInterview(submitAttemptId);
      if (routeKeyRef.current !== submitRoute) return;
      let completionConfirmed = false;
      const turnWasSubmitted = response.turns.some((turn) => turn.turnId === currentTurn.turnId
        && Boolean(turn.transcriptText?.trim()));
      if (!turnWasSubmitted) {
        const submitted = await submitAnswer({
          attemptId: submitAttemptId,
          turnId: currentTurn.turnId,
          transcriptText: transcriptText.trim(),
          language: language === 'vi' ? 'vi' : 'en',
        });
        if (routeKeyRef.current !== submitRoute) return;
        const latest = await getInterview(submitAttemptId);
        if (routeKeyRef.current !== submitRoute) return;
        completionConfirmed = submitted.completed;
        const serverTurnSaved = latest.turns.some((turn) => turn.turnId === currentTurn.turnId && Boolean(turn.transcriptText?.trim()));
        response = !serverTurnSaved && submitted.transcriptText
          ? { ...latest, turns: latest.turns.map((turn) => turn.turnId === currentTurn.turnId
            ? { ...turn, transcriptText: submitted.transcriptText }
            : turn) }
          : latest;
      }
      setSubmitError(null);
      setAttempt(response);
      setCompleted(response.status === 'COMPLETED' || completionConfirmed);
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
    } catch (error) {
      setLoadError(getInterviewErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const abandonAttempt = async () => {
    if (!attempt || abandoning || !window.confirm(t('Kết thúc và bỏ lượt thi đang mở? Lượt đã bắt đầu có thể được tính theo chính sách kỳ thi.'))) return;
    setAbandoning(true);
    try {
      await abandonInterview(attempt.attemptId);
      navigate(APP_ROUTES.student.exams);
    } catch (error) {
      setLoadError(getInterviewErrorMessage(error));
    } finally { setAbandoning(false); }
  };

  const title = t(isSessionRoute ? 'Phòng thi vấn đáp AI' : 'Phiên thi vấn đáp AI');

  return (
    <div className="student-page">
      <StudentPageHeader
        title={title}
        description={id ? `${t('Phiên thi')} ${id}` : t('Không tìm thấy mã phiên thi.')}
        action={{ label: 'Quay lại lịch thi', to: APP_ROUTES.student.exams }}
      />
      {!loading && !loadError && !completed && attempt && <button type="button" className="interview-abandon-button" disabled={abandoning} onClick={() => void abandonAttempt()}>{t(abandoning ? 'Đang kết thúc lượt thi…' : 'Bỏ lượt thi')}</button>}

      {loading && <p className="interview-page-status" role="status">{t('Đang tải trạng thái phiên thi…')}</p>}

      {!loading && loadError && (
        <section className="interview-state-card" role="alert">
          <p>{t(loadError)}</p>
          <button type="button" className="student-primary-button" onClick={reloadAttempt}>
            {t('Tải lại trạng thái phiên thi')}
          </button>
        </section>
      )}

      {!loading && !loadError && completed && (
        <section className="interview-state-card interview-completed" role="status">
          <h2>{t('Phiên thi đã hoàn tất')}</h2>
          <p>{t('Máy chủ đã xác nhận trạng thái hoàn tất của phiên thi này.')}</p>
        </section>
      )}

      {!loading && !loadError && !completed && attempt && currentTurn && (
        <InterviewRoom
          turns={visibleTurns}
          questionPlan={attempt.questionPlan ?? []}
          activeTurnId={currentTurn.turnId}
          isSubmitting={isSubmitting}
          submitError={submitError}
          examAttemptId={attempt.examAttemptId ?? ''}
          onSubmit={handleSubmit}
          onDiscard={() => setSubmitError(null)}
        />
      )}

      {!loading && !loadError && !completed && attempt && !currentTurn && (
        <section className="interview-state-card" role="status">
          <h2>{t('Chưa có câu hỏi hiện tại')}</h2>
          <p>{t('Máy chủ chưa cung cấp lượt hỏi có thể trả lời. Hãy tải lại trạng thái phiên thi hoặc liên hệ hỗ trợ.')}</p>
          <button type="button" className="student-primary-button" onClick={reloadAttempt}>
            {t('Tải lại trạng thái phiên thi')}
          </button>
        </section>
      )}

      <p className="interview-support-link">
        <Link to={APP_ROUTES.student.help}>{t('Cần trợ giúp về micro hoặc kết nối?')}</Link>
      </p>
    </div>
  );
}
