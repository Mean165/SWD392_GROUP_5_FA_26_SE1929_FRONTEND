import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import { claimGradingSubmission, enqueueGradingAiRun, getGradingErrorMessage, getGradingSubmission, renewGradingLock, saveGradingScores } from '../../../api/gradingApi';
import type { GradingSubmissionDetail } from '../../../types/evaluation';
import { useLanguage } from '../../../context/LanguageContext';
import { formatExamDateTime } from '../../../utils/examSession';
import './EvaluationPages.css';
import './EvaluationScore.css';

const STATUS_LABELS: Record<string, string> = {
  WAITING_SESSION: 'Chờ hoàn tất bài thi', AI_PENDING: 'Chờ AI chấm', AI_SCORING: 'AI đang chấm',
  AI_SCORED: 'AI đã chấm', AI_FAILED: 'AI chấm lỗi', IN_REVIEW: 'Chờ giảng viên',
  FINALIZED: 'Đã chốt điểm', RELEASED: 'Đã công bố', REOPENED: 'Đã mở lại', VOIDED: 'Đã hủy',
};

const roundScore = (value: number): number => Number(value.toFixed(6));
const allocateCriterionScores = (total: number, maximums: number[]): number[] => {
  const totalUnits = BigInt(Math.round(total * 1_000_000));
  const maximumUnits = maximums.map((maximum) => BigInt(Math.round(maximum * 1_000_000)));
  const capacity = maximumUnits.reduce((sum, maximum) => sum + maximum, 0n);
  if (capacity === 0n) return maximums.map(() => 0);

  const shares = maximumUnits.map((maximum, index) => {
    const numerator = totalUnits * maximum;
    return { index, units: numerator / capacity, remainder: numerator % capacity };
  });
  let unallocated = totalUnits - shares.reduce((sum, share) => sum + share.units, 0n);
  shares.sort((left, right) => left.remainder === right.remainder
    ? left.index - right.index
    : left.remainder > right.remainder ? -1 : 1);
  for (const share of shares) {
    if (unallocated === 0n) break;
    if (share.units < maximumUnits[share.index]) {
      share.units += 1n;
      unallocated -= 1n;
    }
  }
  shares.sort((left, right) => left.index - right.index);
  return shares.map(({ units }) => Number(units) / 1_000_000);
};
const BLOOM_LABELS: Record<string, string> = {
  REMEMBER: 'Nhớ',
  UNDERSTAND: 'Hiểu',
  APPLY: 'Vận dụng',
  ANALYZE: 'Phân tích',
  EVALUATE: 'Đánh giá',
  CREATE: 'Sáng tạo',
};
const formatScore = (value: number): string => new Intl.NumberFormat('vi-VN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value);

export default function EvaluationDetailPage() {
  const { t } = useLanguage();
  const { id = '' } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<GradingSubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [scoreDraft, setScoreDraft] = useState<Record<string, string>>({});
  const [actionBusy, setActionBusy] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const claimedSubmissionRef = useRef('');

  useEffect(() => {
    const controller = new AbortController();
    if (claimedSubmissionRef.current !== id) setClaimed(false);
    setLoading(true);
    setError('');
    getGradingSubmission(id, controller.signal)
      .then(async (data) => {
        if (controller.signal.aborted) return;
        setSubmission(data);
        if (claimedSubmissionRef.current === id) { setClaimed(true); return; }
        if (['FINALIZED', 'RELEASED', 'VOIDED'].includes(data.status)) return;
        setActionBusy(true);
        setActionError('');
        try {
          await claimGradingSubmission(data.submissionId);
          claimedSubmissionRef.current = id;
          setClaimed(true);
          const claimed = await getGradingSubmission(id, controller.signal);
          if (!controller.signal.aborted) setSubmission(claimed);
        } catch (claimError) {
          if (!controller.signal.aborted) setActionError(getGradingErrorMessage(claimError, 'Không thể nhận quyền chấm bài.'));
        } finally {
          if (!controller.signal.aborted) setActionBusy(false);
        }
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(getGradingErrorMessage(requestError));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, reloadKey]);

  useEffect(() => {
    if (!submission) return;
    const totals = new Map<string, number>();
    submission.lecturerScores.forEach((score) => totals.set(score.questionId, (totals.get(score.questionId) ?? 0) + score.score));
    setScoreDraft(Object.fromEntries([...totals].map(([questionId, score]) => [questionId, String(score)])));
  }, [submission]);

  useEffect(() => {
    if (!submission || !['PENDING', 'RUNNING'].includes(submission.aiStatus)) return;
    let active = true;
    const timer = window.setInterval(() => {
      getGradingSubmission(id)
        .then((data) => { if (active) setSubmission(data); })
        .catch((requestError: unknown) => {
          if (active) setActionError(getGradingErrorMessage(requestError, 'Không thể cập nhật trạng thái chấm AI.'));
        });
    }, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [id, submission?.aiStatus]);

  const mainQuestions = useMemo(() => {
    if (!submission) return [];
    const mainTurns = submission.turns.filter((turn) => turn.turnType === 'MAIN' && turn.questionId);
    const byQuestion = new Map<string, typeof mainTurns[number]>();
    mainTurns.forEach((turn) => { if (turn.questionId && !byQuestion.has(turn.questionId)) byQuestion.set(turn.questionId, turn); });
    return [...byQuestion.values()];
  }, [submission]);

  const totalLecturerScore = roundScore(mainQuestions.reduce((total, question) => {
    const enteredScore = scoreDraft[question.questionId!]?.trim();
    if (!enteredScore) {
      const aiQuestionScore = submission?.aiSuggestions
        .filter((suggestion) => suggestion.questionId === question.questionId && suggestion.points !== null)
        .reduce((sum, suggestion) => sum + (suggestion.points ?? 0), 0);
      return aiQuestionScore === undefined || aiQuestionScore === null ? total : total + aiQuestionScore;
    }
    const score = Number(enteredScore.replace(',', '.'));
    return Number.isFinite(score) ? total + score : total;
  }, 0));
  const totalScoreReady = mainQuestions.length > 0 && mainQuestions.every((question) => {
    if (scoreDraft[question.questionId!]?.trim()) return true;
    return submission?.aiSuggestions.some((suggestion) =>
      suggestion.questionId === question.questionId && suggestion.points !== null) ?? false;
  });

  const saveScores = async () => {
    if (!submission || actionBusy) return;
    const weightTotal = submission.rubricCriteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    if (weightTotal <= 0) {
      setActionError('Rubric không có trọng số tiêu chí hợp lệ để lưu điểm.');
      return;
    }

    const invalidQuestion = mainQuestions.find((question) => {
      const questionScore = scoreDraft[question.questionId!]?.trim();
      if (!questionScore) return false;
      const total = Number(questionScore.replace(',', '.'));
      const questionMax = submission.questionMaxScores?.[question.questionId!] ?? 0;
      return !Number.isFinite(total) || total < 0 || total > questionMax;
    });
    if (invalidQuestion) {
      const questionMax = submission.questionMaxScores?.[invalidQuestion.questionId!] ?? 0;
      setActionError(`Câu ${invalidQuestion.turnOrder}: điểm phải từ 0 đến ${formatScore(questionMax)}.`);
      return;
    }

    const enteredScores = mainQuestions.flatMap((question) => {
      const questionScore = scoreDraft[question.questionId!]?.trim();
      if (!questionScore) return [];
      return [{
        question,
        total: Number(questionScore.replace(',', '.')),
        questionMax: submission.questionMaxScores?.[question.questionId!] ?? 0,
      }];
    });

    const scoreRows = enteredScores.flatMap((entry) => {
      const { question, total, questionMax } = entry;
      let maxAllocated = 0;
      const criterionMaximums = submission.rubricCriteria.map((criterion, index) => {
        const isLast = index === submission.rubricCriteria.length - 1;
        const maxScore = isLast
          ? roundScore(questionMax - maxAllocated)
          : roundScore(questionMax * criterion.weight / weightTotal);
        maxAllocated = roundScore(maxAllocated + maxScore);
        return maxScore;
      });
      const criterionScores = allocateCriterionScores(total, criterionMaximums);
      return submission.rubricCriteria.map((criterion, index) => {
        return {
          questionId: question.questionId!,
          criterionId: criterion.criterionId,
          score: criterionScores[index],
          maxScore: criterionMaximums[index],
          source: 'MANUAL' as const,
          overrideReason: null,
          comment: null,
        };
      });
    });
    const useAiQuestionIds = mainQuestions.flatMap((question) =>
      scoreDraft[question.questionId!]?.trim() ? [] : [question.questionId!]);
    const invalidRow = scoreRows.find((score) => !score.criterionId || !Number.isFinite(score.score)
      || score.score < 0);
    if (invalidRow) {
      const question = mainQuestions.find((item) => item.questionId === invalidRow.questionId);
      setActionError(!invalidRow.criterionId
        ? `Câu ${question?.turnOrder ?? ''}: không tải được tiêu chí chấm. Hãy tải lại bài thi.`
        : `Câu ${question?.turnOrder ?? ''}: điểm tiêu chí không hợp lệ.`);
      return;
    }
    if (!scoreRows.length && !useAiQuestionIds.length) {
      setActionError('Không tìm thấy câu hỏi để lưu điểm.');
      return;
    }
    setActionBusy(true); setActionError(''); setScoreSaved(false);
    try {
      await renewGradingLock(submission.submissionId);
      await saveGradingScores(submission.submissionId, submission.version, scoreRows, useAiQuestionIds);
      setScoreSaved(true);
      setReloadKey((value) => value + 1);
    } catch (requestError) { setActionError(getGradingErrorMessage(requestError, 'Không thể lưu điểm giảng viên.')); }
    finally { setActionBusy(false); }
  };

  const runAi = async () => {
    if (!submission || actionBusy) return;
    setActionBusy(true);
    setActionError('');
    try {
      await enqueueGradingAiRun(submission.submissionId);
      setSubmission(await getGradingSubmission(id));
    } catch (requestError) {
      setActionError(getGradingErrorMessage(requestError, 'Không thể yêu cầu AI chấm bài.'));
    } finally {
      setActionBusy(false);
    }
  };

  return <main className="grading-page">
    <PageHeader title="Bài thi của học sinh" description="Câu hỏi, câu trả lời đã nhận và trạng thái xử lý." />
    <Link className="grading-back-link" to="/lecturer/evaluations">← Quay lại hàng đợi chấm điểm</Link>
    {loading && <p className="grading-state" role="status">Đang tải bài thi...</p>}
    {error && <div className="grading-error grading-detail-error" role="alert">{t(error)} <button type="button" onClick={() => setReloadKey((value) => value + 1)}>Thử lại</button></div>}
    {!loading && !error && submission && <section className="grading-submission">
      <div className="grading-detail-heading"><div><h2>{submission.examName}</h2><p>{submission.studentName} · Lượt {submission.attemptNo}</p></div><span className={`grading-status ${['FINALIZED', 'RELEASED'].includes(submission.status) ? 'green' : submission.status === 'AI_FAILED' ? 'red' : 'blue'}`}>{STATUS_LABELS[submission.status] ?? submission.status}</span></div>
      <dl className="grading-metadata">
        <div><dt>Học sinh</dt><dd>{submission.studentName}</dd></div>
        <div><dt>Hoàn tất lúc</dt><dd>{formatExamDateTime(submission.sessionFinishedAt)}</dd></div>
        <div><dt>Trạng thái AI</dt><dd>{submission.aiStatus}</dd></div>
        <div><dt>Ưu tiên</dt><dd>{submission.priorityScore}</dd></div>
      </dl>
      <h3>Câu hỏi và câu trả lời</h3>
      {submission.turns.length === 0 ? <p role="status">Bài thi chưa có câu trả lời được lưu.</p> : <div className="grading-turns">
        {submission.turns.map((turn) => <article className="grading-turn" key={turn.turnId}>
          <div className="grading-question-score-row">
          <div className="grading-question-content"><h3>Câu {turn.turnOrder} · {turn.turnType === 'FOLLOW_UP' ? 'Câu hỏi tiếp nối' : 'Câu chính'}</h3>
          <p className="grading-question">{turn.questionText || 'Không có nội dung câu hỏi.'}</p>
          <strong>Câu trả lời</strong>
          <p className="grading-answer">{turn.transcriptText || turn.normalizedText || 'Không nhận được câu trả lời.'}</p>
          {turn.needsHumanReview && <span className="grading-status amber">Cần giảng viên rà soát transcript</span>}
          </div>
          {turn.turnType === 'MAIN' && turn.questionId && (() => {
            const questionId = turn.questionId!;
            const maxScore = submission.questionMaxScores?.[questionId] ?? 0;
            const questionAiSuggestions = submission.aiSuggestions.filter((suggestion) => suggestion.questionId === questionId);
            const hasAiScore = questionAiSuggestions.some((suggestion) => suggestion.points !== null);
            const aiScore = questionAiSuggestions.reduce((total, suggestion) => total + (suggestion.points ?? 0), 0);
            return <div className="grading-score-boxes">
              <div className="grading-ai-score-field">
                <label><span>Điểm AI</span><input type="text" value={hasAiScore ? formatScore(aiScore) : ''} placeholder="Chưa có đề xuất" disabled readOnly /></label>
                <div className="grading-score-meta">
                  <span className="grading-question-max">Tối đa <strong>{formatScore(maxScore)}</strong> điểm</span>
                  <span className="grading-bloom-level">Bloom · {BLOOM_LABELS[turn.bloomLevel ?? 'APPLY'] ?? turn.bloomLevel}</span>
                </div>
              </div>
              <label><span>Điểm giảng viên</span><input aria-label={`Điểm giảng viên câu ${turn.turnOrder}`} type="number" min="0" max={maxScore} step="0.01" value={scoreDraft[questionId] ?? ''} disabled={!claimed || submission.status !== 'IN_REVIEW' || !submission.rubricCriteria.length || maxScore <= 0 || actionBusy} onChange={(event) => { setScoreSaved(false); setActionError(''); setScoreDraft((current) => ({ ...current, [questionId]: event.target.value })); }} /></label>
              {maxScore <= 0 && <span className="grading-score-allocation-error" role="alert">Chưa xác định được điểm tối đa theo Bloom. Hãy tải lại bài thi.</span>}
              {submission.rubricCriteria.length > 0
                ? <details><summary>Tiêu chí chấm</summary><ul>{submission.rubricCriteria.map((criterion) => <li key={criterion.criterionId}><strong>{criterion.name}</strong>{criterion.expectedPoints ? ` · ${criterion.expectedPoints}` : ''}</li>)}</ul></details>
                : <span className="grading-score-note">Chưa có rubric nên chưa thể lưu điểm.</span>}
            </div>;
          })()}
          </div>
        </article>)}
      </div>}
      {submission.rubricCriteria.length === 0 && <p className="grading-score-note" role="status">Bài này chưa có rubric chấm điểm.</p>}
      {mainQuestions.length > 0 && <div className="grading-total-score" aria-live="polite">
        <span>Tổng điểm</span>
        <strong>{totalScoreReady ? formatScore(totalLecturerScore) : '—'} <small>/ 10,00</small></strong>
      </div>}
      {actionError && <p className="grading-error" role="alert">{t(actionError)} {!claimed && submission.status === 'IN_REVIEW' && <button type="button" onClick={() => { claimedSubmissionRef.current = ''; setReloadKey((value) => value + 1); }}>Thử nhận quyền lại</button>}</p>}
      {scoreSaved && <p className="grading-score-success" role="status">Đã lưu điểm giảng viên.</p>}
      {!['FINALIZED', 'RELEASED', 'VOIDED'].includes(submission.status) && ['NONE', 'FAILED'].includes(submission.aiStatus) && <div className="grading-score-actions"><button type="button" className="grading-save-button" disabled={actionBusy} onClick={() => void runAi()}>{actionBusy ? 'Đang xử lý…' : submission.aiStatus === 'FAILED' ? 'Thử chấm AI lại' : 'Chấm bằng AI'}</button></div>}
      {claimed && submission.status === 'IN_REVIEW' && submission.rubricCriteria.length > 0 && <div className="grading-score-actions"><button type="button" className="grading-save-button" disabled={actionBusy} onClick={() => void saveScores()}>{actionBusy ? 'Đang lưu…' : 'Lưu điểm giảng viên'}</button></div>}
    </section>}
  </main>;
}
