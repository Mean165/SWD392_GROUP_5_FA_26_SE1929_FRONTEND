import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import { APP_ROUTES } from '../../../constants/routes';
import { useLanguage } from '../../../context/LanguageContext';
import {
  getGenerationQuestions,
  getQuestionGenerationErrorMessage,
  getQuestionGenerationSubjects,
  getQuestionGenerationTopics,
} from '../../../services/question/questionService';
import type {
  BloomLevel,
  PageResult,
  QuestionSource,
  QuestionStatus,
  QuestionSummary,
  SubjectOption,
  TopicOption,
} from '../../../types/question';
import { questionStatusLabel } from './questionLabels';
import GenerateQuestionPage from './GenerateQuestionPage';
import QuestionReviewList from './QuestionReviewList';
import './question-generation.css';

type QuestionBankTab = 'generate' | 'review' | 'list';

const QUESTION_BANK_TABS: Array<{ id: QuestionBankTab; label: string }> = [
  { id: 'generate', label: 'Tạo câu hỏi AI / RAG' },
  { id: 'review', label: 'Duyệt câu hỏi' },
  { id: 'list', label: 'Danh sách câu hỏi' },
];
const BLOOM_LEVELS: BloomLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE'];
const SOURCES: QuestionSource[] = ['AI_GENERATED', 'AI', 'MANUAL', 'IMPORTED'];
const STATUSES: QuestionStatus[] = ['DRAFT', 'APPROVED', 'REJECTED'];
const PAGE_SIZE = 20;

function TabIcon({ tab }: { tab: QuestionBankTab }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="qg-tab-icon">
      {tab === 'generate' && <>
        <path d="m12 2 1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2Z" fill="currentColor" />
        <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" fill="currentColor" />
      </>}
      {tab === 'review' && <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4.5V3h6v1.5M8.5 12l2.2 2.2 4.8-4.8M8.5 17h7" />
      </>}
      {tab === 'list' && <>
        <path d="M9 6h11M9 12h11M9 18h11" />
        <circle cx="4.5" cy="6" r=".8" fill="currentColor" />
        <circle cx="4.5" cy="12" r=".8" fill="currentColor" />
        <circle cx="4.5" cy="18" r=".8" fill="currentColor" />
      </>}
    </svg>
  );
}

export default function QuestionBankPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const initialTab: QuestionBankTab = requestedTab === 'list' || requestedTab === 'review' ? requestedTab : 'generate';
  const [activeTab, setActiveTab] = useState<QuestionBankTab>(initialTab);
  const [visitedTabs, setVisitedTabs] = useState<QuestionBankTab[]>([initialTab]);
  const tabButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const nextTab: QuestionBankTab = requestedTab === 'list' || requestedTab === 'review' ? requestedTab : 'generate';
    setActiveTab(nextTab);
    setVisitedTabs((current) => current.includes(nextTab) ? current : [...current, nextTab]);
  }, [requestedTab]);

  const selectTab = (tab: QuestionBankTab) => {
    setActiveTab(tab);
    setVisitedTabs((current) => current.includes(tab) ? current : [...current, tab]);
    const nextParams = new URLSearchParams(searchParams);
    if (tab === 'generate') nextParams.delete('tab');
    else nextParams.set('tab', tab);
    const nextTabParam = tab === 'generate' ? null : tab;
    if (searchParams.get('tab') !== nextTabParam) setSearchParams(nextParams);
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % QUESTION_BANK_TABS.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + QUESTION_BANK_TABS.length) % QUESTION_BANK_TABS.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = QUESTION_BANK_TABS.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const nextTab = QUESTION_BANK_TABS[nextIndex];
    selectTab(nextTab.id);
    tabButtonRefs.current[nextIndex]?.focus();
  };

  return (
    <main className="qg-page qg-bank-workspace">
      <div className="qg-bank-heading">
        <PageHeader title="Ngân hàng câu hỏi" description="Quản lý câu hỏi AI, duyệt bản nháp và xem danh sách câu hỏi đã lưu." />
        <div className="qg-browser-tabs" role="tablist" aria-label={t('Chức năng ngân hàng câu hỏi')}>
          {QUESTION_BANK_TABS.map((tab, index) => (
            <button
              key={tab.id}
              ref={(element) => { tabButtonRefs.current[index] = element; }}
              id={`qg-tab-${tab.id}`}
              className={`qg-browser-tab${activeTab === tab.id ? ' active' : ''}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`qg-panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              <TabIcon tab={tab.id} />
              <span>{t(tab.label)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="qg-tab-panels">
        {QUESTION_BANK_TABS.map((tab) => (
          <div
            key={tab.id}
            id={`qg-panel-${tab.id}`}
            className="qg-tab-panel"
            role="tabpanel"
            aria-labelledby={`qg-tab-${tab.id}`}
            tabIndex={0}
            hidden={activeTab !== tab.id}
          >
            {!visitedTabs.includes(tab.id) ? null : tab.id === 'generate'
              ? <GenerateQuestionPage embedded />
              : tab.id === 'review'
                ? <QuestionReviewList />
                : <QuestionListPanel />}
          </div>
        ))}
      </div>
    </main>
  );
}

function QuestionListPanel() {
  const { t } = useLanguage();
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [bloomLevel, setBloomLevel] = useState<BloomLevel | ''>('');
  const [sourceType, setSourceType] = useState<QuestionSource | ''>('');
  const [status, setStatus] = useState<QuestionStatus | ''>('');
  const [result, setResult] = useState<PageResult<QuestionSummary> | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [subjectsError, setSubjectsError] = useState('');
  const [topicsError, setTopicsError] = useState('');
  const [filtersRetryKey, setFiltersRetryKey] = useState(0);
  const [listRetryKey, setListRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setFiltersLoading(true);
    setSubjectsError('');
    getQuestionGenerationSubjects(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setSubjects(items);
      })
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) setSubjectsError(getQuestionGenerationErrorMessage(loadError, t('Không thể tải dữ liệu.')));
      })
      .finally(() => {
        if (!controller.signal.aborted) setFiltersLoading(false);
      });
    return () => controller.abort();
  }, [filtersRetryKey, t]);

  useEffect(() => {
    if (!subjectId) {
      setTopics([]);
      setTopicId('');
      setTopicsError('');
      setTopicsLoading(false);
      return;
    }
    const controller = new AbortController();
    setTopicsLoading(true);
    setTopicsError('');
    getQuestionGenerationTopics(subjectId, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setTopics(items);
      })
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) setTopicsError(getQuestionGenerationErrorMessage(loadError, t('Không thể tải dữ liệu.')));
      })
      .finally(() => {
        if (!controller.signal.aborted) setTopicsLoading(false);
      });
    return () => controller.abort();
  }, [subjectId, filtersRetryKey, t]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setListError('');
    getGenerationQuestions({
      bankOnly: false,
      subjectId: subjectId || undefined,
      topicId: topicId || undefined,
      bloomLevel: bloomLevel || undefined,
      sourceType: sourceType || undefined,
      status: status || undefined,
      page,
      size: PAGE_SIZE,
    }, controller.signal)
      .then(setResult)
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) setListError(getQuestionGenerationErrorMessage(loadError, t('Không thể tải danh sách câu hỏi.')));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [subjectId, topicId, bloomLevel, sourceType, status, page, listRetryKey, t]);

  const resetPage = () => setPage(0);

  return (
    <section className="qg-section qg-question-list-panel" aria-labelledby="qg-question-list-heading">
      <div className="qg-section-heading">
        <div>
          <h2 id="qg-question-list-heading">{t('Danh sách câu hỏi')}</h2>
          <p>{t('Tổng số')}: {result?.totalItems ?? 0}</p>
        </div>
      </div>

      <div className="qg-filter-row qg-question-list-filters">
        <label className="qg-field"><span>{t('Môn học')}</span>
          <select className="qg-control" value={subjectId} disabled={filtersLoading} onChange={(event) => { setSubjectId(event.target.value); setTopicId(''); resetPage(); }}>
            <option value="">{t('Tất cả')}</option>
            {subjects.map((subject) => <option key={subject.subjectId} value={subject.subjectId}>{subject.subjectCode} · {subject.subjectName}</option>)}
          </select>
        </label>
        <label className="qg-field"><span>{t('Lọc theo chủ đề')}</span>
          <select className="qg-control" value={topicId} disabled={!subjectId || topicsLoading} onChange={(event) => { setTopicId(event.target.value); resetPage(); }}>
            <option value="">{t('Tất cả')}</option>
            {topics.map((topic) => <option key={topic.topicId} value={topic.topicId}>{topic.topicCode} · {topic.topicName}</option>)}
          </select>
        </label>
        <label className="qg-field"><span>{t('Lọc theo Bloom')}</span>
          <select className="qg-control" value={bloomLevel} onChange={(event) => { setBloomLevel(event.target.value as BloomLevel | ''); resetPage(); }}>
            <option value="">{t('Tất cả')}</option>{BLOOM_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
          </select>
        </label>
        <label className="qg-field"><span>{t('Lọc theo nguồn')}</span>
          <select className="qg-control" value={sourceType} onChange={(event) => { setSourceType(event.target.value as QuestionSource | ''); resetPage(); }}>
            <option value="">{t('Tất cả')}</option>{SOURCES.map((source) => <option key={source} value={source}>{source}</option>)}
          </select>
        </label>
        <label className="qg-field"><span>{t('Lọc theo trạng thái')}</span>
          <select className="qg-control" value={status} onChange={(event) => { setStatus(event.target.value as QuestionStatus | ''); resetPage(); }}>
            <option value="">{t('Tất cả')}</option>{STATUSES.map((questionStatus) => <option key={questionStatus} value={questionStatus}>{questionStatusLabel(questionStatus, t)}</option>)}
          </select>
        </label>
      </div>

      {(subjectsError || topicsError) && <div className="qg-filter-errors" role="alert">
        {subjectsError && <p className="qg-error">{subjectsError}</p>}
        {topicsError && <p className="qg-error">{topicsError}</p>}
        <button type="button" className="qg-text-link" onClick={() => setFiltersRetryKey((current) => current + 1)}>{t('Thử lại')}</button>
      </div>}
      {listError && <div className="qg-list-error" role="alert"><p className="qg-error">{listError}</p><button type="button" className="qg-text-link" onClick={() => setListRetryKey((current) => current + 1)}>{t('Thử lại')}</button></div>}
      {loading && <p className="qg-muted" role="status">{t('Đang tải')}...</p>}
      {!loading && !listError && (result?.items.length ?? 0) === 0 && <div className="qg-empty-panel" role="status">
        <span className="qg-empty-panel-icon" aria-hidden="true"><TabIcon tab="list" /></span>
        <div><strong>{t('Chưa có câu hỏi phù hợp.')}</strong><p>{t('Câu hỏi đã lưu sẽ xuất hiện tại đây cùng trạng thái duyệt hiện tại.')}</p></div>
      </div>}
      {!loading && !listError && (result?.items.length ?? 0) > 0 && <div className="qg-table-wrap">
        <table className="qg-table">
          <thead><tr><th>{t('Nội dung câu hỏi')}</th><th>{t('Mức Bloom')}</th><th>{t('Nguồn')}</th><th>{t('Trạng thái')}</th><th>{t('Độ khó')}</th><th>{t('Thời gian trả lời (phút)')}</th><th>{t('Ngày tạo')}</th></tr></thead>
          <tbody>{result?.items.map((question) => (
            <tr key={question.questionId}>
              <td className="qg-question-cell"><Link to={`${APP_ROUTES.lecturer.questions}/${encodeURIComponent(question.questionId)}`}>{question.questionText}</Link>{question.referenceAnswer && <small>{question.referenceAnswer}</small>}</td>
              <td>{question.bloomLevel}</td><td>{question.sourceType}</td>
              <td><span className={`qg-status qg-status-${question.status.toLowerCase()}`}>{questionStatusLabel(question.status, t)}</span></td>
              <td>{question.estimatedDifficulty ?? '-'}</td><td>{question.suggestedAnswerMinutes ?? '-'}</td><td>{new Date(question.createdAt).toLocaleString()}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>}
      <div className="qg-pagination">
        <button type="button" className="qg-button qg-button-secondary" disabled={page <= 0 || loading} onClick={() => setPage((current) => Math.max(0, current - 1))}>{t('Trước')}</button>
        <span>{t('Trang')} {page + 1} / {Math.max(1, result?.totalPages ?? 1)}</span>
        <button type="button" className="qg-button qg-button-secondary" disabled={page + 1 >= (result?.totalPages ?? 0) || loading} onClick={() => setPage((current) => current + 1)}>{t('Sau')}</button>
      </div>
    </section>
  );
}
