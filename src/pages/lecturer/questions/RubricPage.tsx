import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import { APP_ROUTES } from '../../../constants/routes';
import { useLanguage } from '../../../context/LanguageContext';
import {
  getGenerationQuestionById,
  getGenerationQuestions,
  getQuestionGenerationErrorMessage,
  getQuestionGenerationSubjects,
  getQuestionGenerationTopics,
} from '../../../services/question/questionService';
import type {
  QuestionDetail,
  QuestionStatus,
  QuestionSummary,
  SubjectOption,
  TopicOption,
} from '../../../types/question';
import QuestionEditForm from './QuestionEditForm';
import { questionStatusLabel } from './questionLabels';
import './question-generation.css';

type RubricFilters = {
  keyword: string;
  subjectId: string;
  topicId: string;
  status: QuestionStatus | '';
  questionId: string;
};

const EMPTY_FILTERS: RubricFilters = { keyword: '', subjectId: '', topicId: '', status: '', questionId: '' };
const SERVER_PAGE_SIZE = 100;
const DISPLAY_PAGE_SIZE = 20;
const QUESTION_STATUSES: QuestionStatus[] = ['DRAFT', 'APPROVED', 'REJECTED'];

async function loadAllFilteredQuestions(
  filters: RubricFilters,
  signal: AbortSignal,
): Promise<QuestionSummary[]> {
  const baseQuery = {
    bankOnly: false,
    subjectId: filters.subjectId || undefined,
    topicId: filters.topicId || undefined,
    status: filters.status || undefined,
    size: SERVER_PAGE_SIZE,
  };
  const firstPage = await getGenerationQuestions({ ...baseQuery, page: 0 }, signal);
  const items = [...firstPage.items];

  for (let start = 1; start < firstPage.totalPages; start += 4) {
    const pages = Array.from({ length: Math.min(4, firstPage.totalPages - start) }, (_, offset) => start + offset);
    const nextPages = await Promise.all(pages.map((page) => getGenerationQuestions({ ...baseQuery, page }, signal)));
    nextPages.forEach((result) => items.push(...result.items));
  }

  return items;
}

export default function RubricPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const questionIdFromUrl = searchParams.get('questionId') ?? '';
  const [draftFilters, setDraftFilters] = useState<RubricFilters>(() => ({ ...EMPTY_FILTERS, questionId: questionIdFromUrl }));
  const [appliedFilters, setAppliedFilters] = useState<RubricFilters>(() => ({ ...EMPTY_FILTERS, questionId: questionIdFromUrl }));
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState('');
  const [topicsError, setTopicsError] = useState('');
  const [filtersRetryKey, setFiltersRetryKey] = useState(0);
  const [results, setResults] = useState<QuestionSummary[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [resultsError, setResultsError] = useState('');
  const [searchRun, setSearchRun] = useState(0);
  const [resultsPage, setResultsPage] = useState(0);
  const [topicNameById, setTopicNameById] = useState<Record<string, string>>({});
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionDetail | null>(null);
  const [selectedQuestionLoading, setSelectedQuestionLoading] = useState(false);
  const [selectedQuestionError, setSelectedQuestionError] = useState('');
  const [selectedQuestionRetryKey, setSelectedQuestionRetryKey] = useState(0);
  const [rubricDirty, setRubricDirty] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const topicCache = useRef(new Map<string, TopicOption[]>());
  const currentQuestionId = useRef('');
  const rubricDirtyRef = useRef(false);

  useEffect(() => {
    if (appliedFilters.questionId) {
      setResults([]);
      setResultsError('');
      setResultsLoading(false);
      return undefined;
    }
    const controller = new AbortController();
    setSubjectsLoading(true);
    setSubjectsError('');
    getQuestionGenerationSubjects(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setSubjects(items);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setSubjectsError(getQuestionGenerationErrorMessage(error, t('Không thể tải danh sách môn học.')));
      })
      .finally(() => {
        if (!controller.signal.aborted) setSubjectsLoading(false);
      });
    return () => controller.abort();
  }, [filtersRetryKey, t]);

  const cacheTopics = useCallback((subjectId: string, items: TopicOption[]) => {
    topicCache.current.set(subjectId, items);
    setTopicNameById((current) => {
      const next = { ...current };
      items.forEach((topic) => { next[topic.topicId] = topic.topicName; });
      return next;
    });
  }, []);

  const loadTopicLabels = useCallback(async (subjectIds: string[], signal: AbortSignal) => {
    const uniqueSubjectIds = [...new Set(subjectIds)];
    const missingIds = uniqueSubjectIds.filter((subjectId) => !topicCache.current.has(subjectId));
    const loaded = await Promise.allSettled(missingIds.map(async (subjectId) => ({
      subjectId,
      topics: await getQuestionGenerationTopics(subjectId, signal),
    })));
    if (signal.aborted) return;
    loaded.forEach((result) => {
      if (result.status === 'fulfilled') cacheTopics(result.value.subjectId, result.value.topics);
    });
  }, [cacheTopics]);

  useEffect(() => {
    if (!draftFilters.subjectId) {
      setTopics([]);
      setTopicsError('');
      setTopicsLoading(false);
      return undefined;
    }

    const cached = topicCache.current.get(draftFilters.subjectId);
    if (cached) {
      setTopics(cached);
      setTopicsError('');
      setTopicsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setTopicsLoading(true);
    setTopicsError('');
    getQuestionGenerationTopics(draftFilters.subjectId, controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        cacheTopics(draftFilters.subjectId, items);
        setTopics(items);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setTopicsError(getQuestionGenerationErrorMessage(error, t('Không thể tải danh sách chủ đề.')));
      })
      .finally(() => {
        if (!controller.signal.aborted) setTopicsLoading(false);
      });
    return () => controller.abort();
  }, [cacheTopics, draftFilters.subjectId, filtersRetryKey, t]);

  useEffect(() => {
    const controller = new AbortController();
    setResultsLoading(true);
    setResultsError('');
    loadAllFilteredQuestions(appliedFilters, controller.signal)
      .then(async (items) => {
        await loadTopicLabels(items.map((item) => item.subjectId), controller.signal);
        if (controller.signal.aborted) return;
        const keyword = appliedFilters.keyword.trim().toLocaleLowerCase();
        const matches = keyword
          ? items.filter((question) => `${question.questionText} ${question.referenceAnswer ?? ''}`.toLocaleLowerCase().includes(keyword))
          : items;
        setResults(matches);
        setResultsPage(0);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setResultsError(getQuestionGenerationErrorMessage(error, t('Không thể tải danh sách câu hỏi.')));
      })
      .finally(() => {
        if (!controller.signal.aborted) setResultsLoading(false);
      });
    return () => controller.abort();
  }, [appliedFilters, loadTopicLabels, searchRun, t]);

  const canDiscardRubric = useCallback((): boolean => {
    if (!rubricDirtyRef.current) return true;
    const confirmed = window.confirm(t('Bạn có thay đổi rubric chưa lưu. Bỏ thay đổi và chuyển câu hỏi?'));
    if (confirmed) {
      rubricDirtyRef.current = false;
      setRubricDirty(false);
    }
    return confirmed;
  }, [t]);

  useEffect(() => {
    const nextQuestionId = questionIdFromUrl;
    const previousQuestionId = currentQuestionId.current;
    if (nextQuestionId === previousQuestionId && (selectedQuestion || selectedQuestionLoading)) return undefined;

    if (previousQuestionId && previousQuestionId !== nextQuestionId && !canDiscardRubric()) {
      const restoredParams = new URLSearchParams(searchParams);
      restoredParams.set('questionId', previousQuestionId);
      setSearchParams(restoredParams, { replace: true });
      setDraftFilters((current) => ({ ...current, questionId: previousQuestionId }));
      return undefined;
    }

    rubricDirtyRef.current = false;
    setRubricDirty(false);
    setSelectedQuestion(null);
    setSelectedQuestionError('');
    setDraftFilters((current) => ({ ...current, questionId: nextQuestionId }));
    if (!nextQuestionId) {
      currentQuestionId.current = '';
      setSelectedQuestionLoading(false);
      return undefined;
    }

    currentQuestionId.current = nextQuestionId;
    const controller = new AbortController();
    setSelectedQuestionLoading(true);
    getGenerationQuestionById(nextQuestionId, controller.signal)
      .then(async (question) => {
        if (controller.signal.aborted) return;
        setSelectedQuestion(question);
        await loadTopicLabels([question.subjectId], controller.signal);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setSelectedQuestionError(getQuestionGenerationErrorMessage(error, t('Không thể tải dữ liệu.')));
      })
      .finally(() => {
        if (!controller.signal.aborted) setSelectedQuestionLoading(false);
      });
    return () => controller.abort();
  }, [canDiscardRubric, loadTopicLabels, questionIdFromUrl, searchParams, selectedQuestionRetryKey, setSearchParams, t]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => setSuccessMessage(''), 3500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextFilters = {
      ...draftFilters,
      keyword: draftFilters.keyword.trim(),
      questionId: draftFilters.questionId.trim(),
    };
    setAppliedFilters(nextFilters);
    setResultsPage(0);
    if (nextFilters.questionId && nextFilters.questionId !== currentQuestionId.current) {
      if (!canDiscardRubric()) return;
      const params = new URLSearchParams(searchParams);
      params.set('questionId', nextFilters.questionId);
      setSearchParams(params);
    }
  };

  const clearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setResultsPage(0);
    setSearchRun((current) => current + 1);
  };

  const chooseQuestion = (questionId: string) => {
    if (questionId === currentQuestionId.current || !canDiscardRubric()) return;
    const params = new URLSearchParams(searchParams);
    params.set('questionId', questionId);
    setSearchParams(params);
  };

  const clearSelectedQuestion = () => {
    if (!canDiscardRubric()) return;
    const params = new URLSearchParams(searchParams);
    params.delete('questionId');
    setSearchParams(params);
  };

  const handleRubricDirty = useCallback((dirty: boolean) => {
    rubricDirtyRef.current = dirty;
    setRubricDirty(dirty);
  }, []);

  const visibleResults = useMemo(
    () => results.slice(resultsPage * DISPLAY_PAGE_SIZE, (resultsPage + 1) * DISPLAY_PAGE_SIZE),
    [results, resultsPage],
  );
  const displayPages = Math.max(1, Math.ceil(results.length / DISPLAY_PAGE_SIZE));
  const selectedSubject = subjects.find((subject) => subject.subjectId === selectedQuestion?.subjectId);

  return (
    <main className="qg-page qg-rubric-page">
      <PageHeader title="Quản lý thang điểm" description="Tìm câu hỏi đã lưu, sau đó xem và cập nhật rubric." />

      <section className="qg-rubric-search-panel" aria-labelledby="qg-rubric-search-title">
        <div className="qg-rubric-search-heading">
          <div><h2 id="qg-rubric-search-title">{t('Tìm câu hỏi')}</h2><p>{t('Chọn câu hỏi từ danh sách để xem rubric hiện tại.')}</p></div>
        </div>

        <form className="qg-rubric-filter-form" onSubmit={handleSearch}>
          <label className="qg-field qg-rubric-keyword-field">
            <span>{t('Nội dung hoặc từ khóa')}</span>
            <input className="qg-control" type="search" value={draftFilters.keyword} placeholder={t('Nhập nội dung hoặc từ khóa câu hỏi...')} onChange={(event) => setDraftFilters((current) => ({ ...current, keyword: event.target.value }))} />
          </label>
          <label className="qg-field">
            <span>{t('Môn học')}</span>
            <select className="qg-control" value={draftFilters.subjectId} disabled={subjectsLoading} onChange={(event) => setDraftFilters((current) => ({ ...current, subjectId: event.target.value, topicId: '' }))}>
              <option value="">{t('Tất cả môn học')}</option>
              {subjects.map((subject) => <option key={subject.subjectId} value={subject.subjectId}>{subject.subjectCode} · {subject.subjectName}</option>)}
            </select>
          </label>
          <label className="qg-field">
            <span>{t('Chủ đề')}</span>
            <select className="qg-control" value={draftFilters.topicId} disabled={!draftFilters.subjectId || topicsLoading} onChange={(event) => setDraftFilters((current) => ({ ...current, topicId: event.target.value }))}>
              <option value="">{t('Tất cả chủ đề')}</option>
              {topics.map((topic) => <option key={topic.topicId} value={topic.topicId}>{topic.topicCode} · {topic.topicName}</option>)}
            </select>
          </label>
          <label className="qg-field">
            <span>{t('Trạng thái duyệt')}</span>
            <select className="qg-control" value={draftFilters.status} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value as QuestionStatus | '' }))}>
              <option value="">{t('Tất cả trạng thái')}</option>
              {QUESTION_STATUSES.map((status) => <option key={status} value={status}>{questionStatusLabel(status, t)}</option>)}
            </select>
          </label>
          <details className="qg-rubric-advanced qg-field-wide">
            <summary>{t('Tìm kiếm nâng cao')}</summary>
            <label className="qg-field">
              <span>{t('Mã câu hỏi (tùy chọn)')}</span>
              <input className="qg-control" value={draftFilters.questionId} placeholder={t('Chỉ nhập mã nếu bạn đã có UUID')} onChange={(event) => setDraftFilters((current) => ({ ...current, questionId: event.target.value }))} />
            </label>
          </details>
          {subjectsError && <div className="qg-rubric-inline-error" role="alert">{subjectsError}<button type="button" className="qg-text-link" onClick={() => setFiltersRetryKey((key) => key + 1)}>{t('Thử lại')}</button></div>}
          {topicsError && <div className="qg-rubric-inline-error" role="alert">{topicsError}<button type="button" className="qg-text-link" onClick={() => setFiltersRetryKey((key) => key + 1)}>{t('Thử lại')}</button></div>}
          <div className="qg-rubric-search-actions qg-field-wide">
            <span>{subjectsLoading || topicsLoading ? `${t('Đang tải')}...` : ''}</span>
            <div><button type="button" className="qg-button qg-button-secondary" onClick={clearFilters}>{t('Xóa bộ lọc')}</button><button type="submit" className="qg-button" disabled={resultsLoading}>{t('Tìm kiếm')}</button></div>
          </div>
        </form>
      </section>

      {successMessage && <p className="qg-success" role="status">{successMessage}</p>}
      {resultsError && <div className="qg-list-error" role="alert"><p className="qg-error">{resultsError}</p><button type="button" className="qg-text-link" onClick={() => setSearchRun((current) => current + 1)}>{t('Thử lại')}</button></div>}

      {!appliedFilters.questionId && <section className="qg-section qg-rubric-results" aria-labelledby="qg-rubric-results-title">
        <div className="qg-section-heading">
          <div><h2 id="qg-rubric-results-title">{t('Kết quả câu hỏi')}</h2><p>{t('Tổng số')}: {results.length}</p></div>
          {resultsLoading && <span className="qg-muted" role="status">{t('Đang tải')}...</span>}
        </div>
        {resultsLoading && !results.length ? <p className="qg-muted" role="status">{t('Đang tải')}...</p> : null}
        {!resultsLoading && !resultsError && !visibleResults.length ? (
          <div className="qg-empty-panel" role="status"><span className="qg-empty-panel-icon" aria-hidden="true">⌕</span><div><strong>{t('Không tìm thấy câu hỏi phù hợp.')}</strong><p>{t('Thử thay đổi từ khóa hoặc bộ lọc.')}</p></div></div>
        ) : visibleResults.length > 0 ? (
          <div className="qg-table-wrap"><table className="qg-table qg-rubric-question-table">
            <thead><tr><th>{t('Nội dung câu hỏi')}</th><th>{t('Môn học')}</th><th>{t('Chủ đề')}</th><th>{t('Trạng thái duyệt')}</th><th>{t('Bloom')}</th><th>{t('Thao tác')}</th></tr></thead>
            <tbody>{visibleResults.map((item) => {
              const subject = subjects.find((option) => option.subjectId === item.subjectId);
              return <tr key={item.questionId} className={item.questionId === selectedQuestion?.questionId ? 'selected' : undefined}>
                <td className="qg-rubric-question-text"><strong>{item.questionText}</strong>{item.referenceAnswer && <small>{item.referenceAnswer}</small>}</td>
                <td>{subject ? `${subject.subjectCode} · ${subject.subjectName}` : '—'}</td>
                <td>{topicNameById[item.topicId] ?? '—'}</td>
                <td><span className={`qg-status qg-status-${item.status.toLowerCase()}`}>{questionStatusLabel(item.status, t)}</span></td>
                <td>{item.bloomLevel}</td>
                <td><button type="button" className="qg-button qg-button-secondary qg-button-small" onClick={() => chooseQuestion(item.questionId)}>{t(item.questionId === selectedQuestion?.questionId ? 'Đang chọn' : 'Chọn câu hỏi')}</button></td>
              </tr>;
            })}</tbody>
          </table></div>
        ) : null}
        {results.length > DISPLAY_PAGE_SIZE && <div className="qg-pagination">
          <button type="button" className="qg-button qg-button-secondary" disabled={resultsPage === 0 || resultsLoading} onClick={() => setResultsPage((page) => Math.max(0, page - 1))}>{t('Trước')}</button>
          <span>{t('Trang')} {resultsPage + 1} / {displayPages}</span>
          <button type="button" className="qg-button qg-button-secondary" disabled={resultsPage + 1 >= displayPages || resultsLoading} onClick={() => setResultsPage((page) => Math.min(displayPages - 1, page + 1))}>{t('Sau')}</button>
        </div>}
      </section>}

      {selectedQuestionLoading && <p className="qg-muted" role="status">{t('Đang tải câu hỏi đã chọn')}...</p>}
      {selectedQuestionError && <div className="qg-list-error" role="alert"><p className="qg-error">{selectedQuestionError}</p><button type="button" className="qg-text-link" onClick={() => setSelectedQuestionRetryKey((key) => key + 1)}>{t('Thử lại')}</button></div>}
      {selectedQuestion && <section className="qg-section qg-selected-question" aria-labelledby="qg-selected-question-heading">
        <div className="qg-selected-question-header">
          <div><span className="qg-status qg-status-selected">{t('Câu hỏi đã chọn')}</span><h2 id="qg-selected-question-heading">{t('Rubric câu hỏi')}</h2></div>
          <button type="button" className="qg-button qg-button-secondary qg-button-small" onClick={clearSelectedQuestion}>{t('Bỏ chọn')}</button>
        </div>
        <p className="qg-selected-question-text">{selectedQuestion.questionText}</p>
        <div className="qg-selected-question-meta">
          <span>{selectedSubject ? `${selectedSubject.subjectCode} · ${selectedSubject.subjectName}` : '—'}</span>
          <span>{topicNameById[selectedQuestion.topicId] ?? '—'}</span>
          <span className={`qg-status qg-status-${selectedQuestion.status.toLowerCase()}`}>{questionStatusLabel(selectedQuestion.status, t)}</span>
        </div>
        {rubricDirty && <p className="qg-rubric-unsaved" role="status">{t('Có thay đổi rubric chưa lưu.')}</p>}
        <QuestionEditForm key={selectedQuestion.questionId} question={selectedQuestion} rubricOnly onUpdated={setSelectedQuestion} onDirtyChange={handleRubricDirty} />
      </section>}
      {!selectedQuestion && !selectedQuestionLoading && !selectedQuestionError && <p className="qg-muted qg-rubric-select-prompt">{t('Chọn câu hỏi để xem hoặc thiết lập rubric.')}</p>}
      <div className="qg-inline-actions qg-page-navigation">
        <Link className="qg-button qg-button-secondary" to={APP_ROUTES.lecturer.questionList}>{t('Câu hỏi trong ngân hàng')}</Link>
        <Link className="qg-button qg-button-secondary" to={APP_ROUTES.lecturer.examCreate}>{t('Tạo kỳ thi')}</Link>
      </div>
    </main>
  );
}
