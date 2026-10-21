import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import { APP_ROUTES } from '../../../constants/routes';
import { useLanguage } from '../../../context/LanguageContext';
import { getGenerationQuestionById, getQuestionGenerationErrorMessage } from '../../../services/question/questionService';
import type { QuestionDetail } from '../../../types/question';
import { questionStatusLabel } from './questionLabels';
import './question-generation.css';

export default function QuestionDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setQuestion(null);
    setError('');
    getGenerationQuestionById(id, controller.signal)
      .then(setQuestion)
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) setError(getQuestionGenerationErrorMessage(loadError, t('Không thể tải dữ liệu.')));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, t]);

  const canEdit = question?.status === 'DRAFT' || question?.status === 'APPROVED';

  return (
    <main className="qg-page">
      <PageHeader title="Chi tiết câu hỏi" description="Nội dung, đáp án tham khảo, rubric và nguồn trích dẫn." />
      {loading && <p className="qg-muted" role="status">{t('Đang tải')}...</p>}
      {error && <p className="qg-error" role="alert">{error}</p>}
      {question && <>
        <div className="qg-section-heading">
          <div className="qg-job-meta">
            <span className={`qg-status qg-status-${question.status.toLowerCase()}`}>{questionStatusLabel(question.status, t)}</span>
            <span>{t('Nguồn')}: {question.sourceType}</span>
            <span>{t('Mức Bloom')}: {question.bloomLevel}</span>
          </div>
          {canEdit && <div className="qg-inline-actions">
            <Link className="qg-button" to={`${APP_ROUTES.lecturer.questions}/${encodeURIComponent(question.questionId)}/edit`}>{t('Chỉnh sửa')}</Link>
            <Link className="qg-button qg-button-secondary" to={`${APP_ROUTES.lecturer.rubrics}?questionId=${encodeURIComponent(question.questionId)}`}>{t('Rubric câu hỏi')}</Link>
          </div>}
        </div>
        <div className="qg-detail-grid">
          <section className="qg-detail-block qg-field-wide">
            <h3>{t('Nội dung câu hỏi')}</h3>
            <p>{question.questionText}</p>
          </section>
          <section className="qg-detail-block qg-field-wide">
            <h3>{t('Câu trả lời tham khảo')}</h3>
            <p>{question.referenceAnswer || '-'}</p>
          </section>
          <section className="qg-detail-block">
            <h3>{t('Độ khó')}</h3>
            <p>{question.estimatedDifficulty ?? '-'}</p>
          </section>
          <section className="qg-detail-block">
            <h3>{t('Thời gian trả lời (phút)')}</h3>
            <p>{question.suggestedAnswerMinutes ?? '-'}</p>
          </section>
          <section className="qg-detail-block qg-field-wide">
            <h3>{t('Tiêu chí chấm điểm')}</h3>
            {question.rubric.length ? <div className="qg-table-wrap"><table className="qg-table">
              <thead><tr><th>{t('Tên tiêu chí')}</th><th>{t('Mô tả tiêu chí')}</th><th>{t('Điểm tối đa')}</th><th>{t('Trọng số')}</th></tr></thead>
              <tbody>{question.rubric.map((criterion, index) => <tr key={criterion.criteriaId ?? `${criterion.name}-${index}`}>
                <td>{criterion.name}</td><td>{criterion.description}</td><td>{criterion.maxPoints}</td><td>{criterion.weight}</td>
              </tr>)}</tbody>
            </table></div> : <p>{t('Không có rubric.')}</p>}
          </section>
          <section className="qg-detail-block qg-field-wide">
            <h3>{t('Nguồn trích dẫn')}</h3>
            {question.citations.length ? <div className="qg-table-wrap"><table className="qg-table">
              <thead><tr><th>{t('Tên tài liệu')}</th><th>{t('Vị trí')}</th></tr></thead>
              <tbody>{question.citations.map((citation, index) => <tr key={`${citation.documentId}-${citation.chunkId}-${index}`}>
                <td>{citation.filename}</td><td>{citation.location}</td>
              </tr>)}</tbody>
            </table></div> : <p>{t('Không có trích dẫn.')}</p>}
          </section>
        </div>
      </>}
      <Link className="qg-button qg-button-secondary" to={APP_ROUTES.lecturer.questionList}>{t('Câu hỏi trong ngân hàng')}</Link>
    </main>
  );
}
