import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import { APP_ROUTES } from '../../../constants/routes';
import { useLanguage } from '../../../context/LanguageContext';
import { getGenerationQuestionById, getQuestionGenerationErrorMessage } from '../../../services/question/questionService';
import type { QuestionDetail } from '../../../types/question';
import QuestionEditForm from './QuestionEditForm';
import { questionStatusLabel } from './questionLabels';
import './question-generation.css';

export default function EditQuestionPage() {
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

  return (
    <main className="qg-page">
      <PageHeader title="Chỉnh sửa câu hỏi" description="Cập nhật nội dung, câu trả lời tham khảo và rubric của câu hỏi." />
      {loading && <p className="qg-muted" role="status">{t('Đang tải')}...</p>}
      {error && <p className="qg-error" role="alert">{error}</p>}
      {question && <>
        <div className="qg-job-meta">
          <span className={`qg-status qg-status-${question.status.toLowerCase()}`}>{questionStatusLabel(question.status, t)}</span>
          <span>{question.sourceType}</span>
          <span>{t('Mức Bloom')}: {question.bloomLevel}</span>
        </div>
        <QuestionEditForm question={question} onUpdated={setQuestion} />
      </>}
      <div className="qg-inline-actions qg-page-navigation">
        <Link className="qg-button qg-button-secondary" to={`${APP_ROUTES.lecturer.questions}/${encodeURIComponent(id)}`}>{t('Chi tiết câu hỏi')}</Link>
        <Link className="qg-button qg-button-secondary" to={APP_ROUTES.lecturer.questionList}>{t('Câu hỏi trong ngân hàng')}</Link>
      </div>
    </main>
  );
}
