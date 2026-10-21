import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { APP_ROUTES } from '../../../constants/routes';
import {
  approveGenerationQuestion,
  approveGenerationQuestions,
  getGenerationQuestions,
  getQuestionGenerationErrorMessage,
  rejectGenerationQuestion,
} from '../../../services/question/questionService';
import type { PageResult, QuestionSummary } from '../../../types/question';
import './question-generation.css';

const PAGE_SIZE = 10;

type PendingConfirmation =
  | { type: 'reject'; questionId: string }
  | { type: 'approve-selected'; questionIds: string[] };

type QuestionReviewListProps = {
  jobId?: string;
  subjectId?: string;
  topicId?: string;
  refreshToken?: string | number;
};

export default function QuestionReviewList({ jobId, subjectId, topicId, refreshToken }: QuestionReviewListProps) {
  const { t } = useLanguage();
  const [result, setResult] = useState<PageResult<QuestionSummary> | null>(null);
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const confirmationCancelRef = useRef<HTMLButtonElement>(null);
  const confirmationDialogRef = useRef<HTMLElement>(null);

  const reload = useCallback(() => setRefreshKey((current) => current + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    getGenerationQuestions({ jobId, subjectId, topicId, status: 'DRAFT', page, size: PAGE_SIZE }, controller.signal)
      .then((data) => {
        setResult(data);
        setSelectedIds((current) => current.filter((id) => data.items.some((question) => question.questionId === id)));
      })
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) setError(getQuestionGenerationErrorMessage(loadError, t('Không thể tải danh sách câu hỏi.')));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [jobId, subjectId, topicId, page, refreshKey, refreshToken, t]);

  useEffect(() => {
    if (!pendingConfirmation) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    confirmationCancelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setPendingConfirmation(null);
        return;
      }

      if (event.key !== 'Tab') return;
      const buttons = confirmationDialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
      if (!buttons?.length) return;
      const firstButton = buttons[0];
      const lastButton = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === firstButton) {
        event.preventDefault();
        lastButton.focus();
      } else if (!event.shiftKey && document.activeElement === lastButton) {
        event.preventDefault();
        firstButton.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [pendingConfirmation]);

  const toggleSelected = (questionId: string) => {
    setSelectedIds((current) => current.includes(questionId)
      ? current.filter((id) => id !== questionId)
      : [...current, questionId]);
  };

  const approveOne = async (questionId: string) => {
    setBusy(true);
    setError('');
    try {
      await approveGenerationQuestion(questionId);
      setSelectedIds((current) => current.filter((id) => id !== questionId));
      reload();
    } catch (actionError) {
      setError(getQuestionGenerationErrorMessage(actionError, t('Không thể thực hiện thao tác.')));
    } finally {
      setBusy(false);
    }
  };

  const openRejectConfirmation = (questionId: string) => {
    setPendingConfirmation({ type: 'reject', questionId });
  };

  const approveSelected = () => {
    if (!selectedIds.length) return;
    setPendingConfirmation({ type: 'approve-selected', questionIds: [...selectedIds] });
  };

  const confirmPendingAction = async () => {
    if (!pendingConfirmation) return;
    const action = pendingConfirmation;
    setPendingConfirmation(null);
    setBusy(true);
    setError('');
    try {
      if (action.type === 'reject') {
        await rejectGenerationQuestion(action.questionId);
        setSelectedIds((current) => current.filter((id) => id !== action.questionId));
      } else {
        await approveGenerationQuestions(action.questionIds);
        setSelectedIds([]);
      }
      reload();
    } catch (actionError) {
      setError(getQuestionGenerationErrorMessage(actionError, t('Không thể thực hiện thao tác.')));
    } finally {
      setBusy(false);
    }
  };

  const drafts = result?.items ?? [];

  return (
    <section className="qg-section" aria-labelledby="qg-review-title">
      <div className="qg-section-heading">
        <div>
          <h2 id="qg-review-title">{t('Bản nháp cần duyệt')}</h2>
          {result && <p>{t('Tổng số')}: {result.totalItems}</p>}
        </div>
        {selectedIds.length > 0 && (
          <button type="button" className="qg-button" disabled={busy} onClick={approveSelected}>
            {t('Duyệt mục đã chọn')} ({selectedIds.length})
          </button>
        )}
      </div>

      {error && <p className="qg-error" role="alert">{error}</p>}
      {loading && <p className="qg-muted" role="status">{t('Đang tải')}...</p>}
      {!loading && drafts.length === 0 && !error && <p className="qg-empty">{t('Không có bản nháp nào cần duyệt.')}</p>}
      {!loading && drafts.length > 0 && <>
        <div className="qg-table-wrap">
          <table className="qg-table">
            <thead>
              <tr>
                <th><span className="qg-sr-only">{t('Chọn bản nháp')}</span></th>
                <th>{t('Nội dung câu hỏi')}</th>
                <th>{t('Mức Bloom')}</th>
                <th>{t('Nguồn')}</th>
                <th>{t('Trạng thái')}</th>
                <th>{t('Chỉnh sửa')}</th>
                <th>{t('Duyệt')}</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((question) => (
                <tr key={question.questionId}>
                  <td><input type="checkbox" aria-label={`${t('Chọn bản nháp')}: ${question.questionId}`} checked={selectedIds.includes(question.questionId)} onChange={() => toggleSelected(question.questionId)} /></td>
                  <td className="qg-question-cell">
                    <Link to={`${APP_ROUTES.lecturer.questions}/${encodeURIComponent(question.questionId)}`}>{question.questionText}</Link>
                    {question.referenceAnswer && <small>{question.referenceAnswer}</small>}
                  </td>
                  <td>{question.bloomLevel}</td>
                  <td>{question.sourceType}</td>
                  <td><span className="qg-status qg-status-draft">{t('Bản nháp')}</span></td>
                  <td><Link className="qg-text-link" to={`${APP_ROUTES.lecturer.questions}/${encodeURIComponent(question.questionId)}/edit`}>{t('Chỉnh sửa')}</Link></td>
                  <td className="qg-row-actions">
                    <button type="button" className="qg-button qg-button-small" disabled={busy} onClick={() => approveOne(question.questionId)}>{t('Duyệt')}</button>
                    <button type="button" className="qg-button qg-button-danger qg-button-small" disabled={busy} onClick={() => openRejectConfirmation(question.questionId)}>{t('Từ chối')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="qg-pagination">
          <button type="button" className="qg-button qg-button-secondary" disabled={page <= 0 || loading} onClick={() => { setPage((current) => Math.max(0, current - 1)); setSelectedIds([]); }}>{t('Trước')}</button>
          <span>{t('Trang')} {page + 1} / {Math.max(1, result?.totalPages ?? 1)}</span>
          <button type="button" className="qg-button qg-button-secondary" disabled={page + 1 >= (result?.totalPages ?? 0) || loading} onClick={() => { setPage((current) => current + 1); setSelectedIds([]); }}>{t('Sau')}</button>
        </div>
      </>}
      {pendingConfirmation && createPortal(
        <div className="qg-confirm-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingConfirmation(null); }}>
          <section
            ref={confirmationDialogRef}
            className="qg-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="qg-confirm-title"
            aria-describedby="qg-confirm-description"
          >
            <div className={`qg-confirm-icon ${pendingConfirmation.type === 'reject' ? 'qg-confirm-icon-danger' : 'qg-confirm-icon-primary'}`} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 8v5m0 3h.01M10.3 3.9 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              </svg>
            </div>
            <h2 id="qg-confirm-title">{t(pendingConfirmation.type === 'reject' ? 'Xác nhận từ chối bản nháp' : 'Xác nhận duyệt bản nháp')}</h2>
            <p id="qg-confirm-description">
              {t(pendingConfirmation.type === 'reject' ? 'Bạn có chắc muốn từ chối bản nháp này?' : 'Bạn có chắc muốn duyệt các bản nháp đã chọn?')}
            </p>
            <div className="qg-confirm-actions">
              <button ref={confirmationCancelRef} type="button" className="qg-button qg-button-secondary" onClick={() => setPendingConfirmation(null)}>
                {t('Quay lại')}
              </button>
              <button
                type="button"
                className={`qg-button ${pendingConfirmation.type === 'reject' ? 'qg-button-confirm-danger' : ''}`}
                onClick={() => void confirmPendingAction()}
              >
                {pendingConfirmation.type === 'reject' ? t('Từ chối bản nháp') : `${t('Duyệt bản nháp')} (${pendingConfirmation.questionIds.length})`}
              </button>
            </div>
          </section>
        </div>,
        document.body,
      )}
    </section>
  );
}
