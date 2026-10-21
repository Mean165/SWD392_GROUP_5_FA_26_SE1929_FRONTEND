import { Link } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import { APP_ROUTES } from '../../../constants/routes';
import { useLanguage } from '../../../context/LanguageContext';
import QuestionReviewList from './QuestionReviewList';
import './question-generation.css';

export default function QuestionReviewPage() {
  const { t } = useLanguage();
  return (
    <main className="qg-page">
      <PageHeader title="Duyệt câu hỏi AI" description="Rà soát bản nháp, chỉnh sửa nội dung, rồi duyệt hoặc từ chối." />
      <QuestionReviewList />
      <div className="qg-inline-actions">
        <Link className="qg-text-link" to={APP_ROUTES.lecturer.questionsGenerate}>{t('Tạo câu hỏi AI / RAG')}</Link>
        <Link className="qg-button qg-button-secondary" to={APP_ROUTES.lecturer.questionList}>{t('Câu hỏi trong ngân hàng')}</Link>
      </div>
    </main>
  );
}
