import axios from 'axios';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import { APP_ROUTES } from '../../../constants/routes';
import { useLanguage } from '../../../context/LanguageContext';
import {
  createQuestionGenerationJob,
  deleteQuestionDocument,
  getQuestionDocument,
  getQuestionDocuments,
  getQuestionGenerationErrorMessage,
  getQuestionGenerationJob,
  getQuestionGenerationRetryAfter,
  getQuestionGenerationSubjects,
  getQuestionGenerationTopics,
  uploadQuestionDocument,
} from '../../../services/question/questionService';
import type {
  BloomLevel,
  CreateGenerationJobRequest,
  GenerationJob,
  QuestionDocument,
  SubjectOption,
  TopicOption,
} from '../../../types/question';
import QuestionReviewList from './QuestionReviewList';
import './question-generation.css';

const JOB_STORAGE_KEY = 'aiviva-question-generation-job';
const BLOOM_LEVELS: BloomLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE'];
const DOCUMENT_POLL_MS = 1500;
const JOB_POLL_MS = 2500;
const JOB_WAIT_LIMIT_MS = 120000;

type UploadingFile = { id: string; filename: string; error?: string };

type ScopeNoticeProps = {
  variant: 'info' | 'error';
  children: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

function ScopeNotice({ variant, children, actionLabel, onAction }: ScopeNoticeProps) {
  return (
    <div className={`qg-scope-notice qg-scope-notice-${variant}`} role={variant === 'error' ? 'alert' : 'status'}>
      <span className="qg-scope-notice-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          {variant === 'error' ? <><circle cx="12" cy="12" r="9" /><path d="M12 8v5m0 3h.01" /></> : <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>}
        </svg>
      </span>
      <p>{children}</p>
      {actionLabel && onAction && <button type="button" className="qg-button qg-button-secondary qg-button-small" onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}

const statusClass = (status: string) => `qg-status qg-status-${status.toLowerCase()}`;
const documentStatusLabel = (status: QuestionDocument['status'], t: (text: string) => string) => ({
  UPLOADED: t('Đã tải lên'),
  PROCESSING: t('Đang xử lý'),
  READY: t('Sẵn sàng'),
  FAILED: t('Thất bại'),
}[status]);
const jobStatusLabel = (status: GenerationJob['status'], t: (text: string) => string) => ({
  QUEUED: t('Đang chờ xử lý'),
  RUNNING: t('Đang xử lý'),
  DONE: t('Hoàn tất'),
  FAILED: t('Thất bại'),
}[status]);
const formatSize = (size: number) => size < 1024 * 1024
  ? `${(size / 1024).toFixed(0)} KB`
  : `${(size / (1024 * 1024)).toFixed(1)} MB`;

type GenerateQuestionPageProps = { embedded?: boolean };

export default function GenerateQuestionPage({ embedded = false }: GenerateQuestionPageProps) {
  const { t, language } = useLanguage();
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [documents, setDocuments] = useState<QuestionDocument[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState('');
  const [topicsError, setTopicsError] = useState('');
  const [documentsError, setDocumentsError] = useState('');
  const [authenticationRequired, setAuthenticationRequired] = useState(false);
  const [subjectsRetryKey, setSubjectsRetryKey] = useState(0);
  const [topicsRetryKey, setTopicsRetryKey] = useState(0);
  const [documentsRetryKey, setDocumentsRetryKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [documentError, setDocumentError] = useState('');
  const [pageError, setPageError] = useState('');
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [storedJobId, setStoredJobId] = useState(() => {
    try {
      return localStorage.getItem(JOB_STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [jobError, setJobError] = useState('');
  const [jobCreating, setJobCreating] = useState(false);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [pollUnavailable, setPollUnavailable] = useState(false);
  const [pollCycle, setPollCycle] = useState(0);
  const [numberOfQuestions, setNumberOfQuestions] = useState(4);
  const [bloomDistribution, setBloomDistribution] = useState<Record<BloomLevel, number>>({
    REMEMBER: 1,
    UNDERSTAND: 1,
    APPLY: 1,
    ANALYZE: 1,
  });
  const [generationLanguage, setGenerationLanguage] = useState<'vi' | 'en'>(language);
  const [generateRubric, setGenerateRubric] = useState(true);
  const [rubricTotalPoints, setRubricTotalPoints] = useState(10);
  const jobStartedAt = useRef<number | null>(null);
  const uploadSequence = useRef(0);

  const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        setAuthenticationRequired(true);
        return t('Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (error.response?.status === 403) {
        return t('Tài khoản Lecturer không có quyền với môn đó.');
      }
      if (error.response?.status === 413) {
        return t('Tệp vượt quá giới hạn dung lượng cho phép.');
      }
      if (error.response?.status === 415) {
        return t('Định dạng hoặc MIME type của tệp không được hỗ trợ.');
      }
      if (!error.response) {
        return t('Không thể kết nối đến máy chủ. Hãy kiểm tra kết nối mạng rồi thử lại.');
      }
    }
    return getQuestionGenerationErrorMessage(error, fallback);
  };

  useEffect(() => {
    const controller = new AbortController();
    setSubjectsLoading(true);
    setSubjectsError('');
    getQuestionGenerationSubjects(controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setSubjects(items);
        setAuthenticationRequired(false);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setSubjectsError(getApiErrorMessage(error, t('Không thể tải danh sách môn học.')));
      })
      .finally(() => {
        if (!controller.signal.aborted) setSubjectsLoading(false);
      });
    return () => controller.abort();
  }, [subjectsRetryKey, t]);

  useEffect(() => {
    if (!subjectId) {
      setTopics([]);
      setTopicsError('');
      setTopicsLoading(false);
      return;
    }
    const controller = new AbortController();
    setTopicsLoading(true);
    setTopicsError('');
    getQuestionGenerationTopics(subjectId, controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setTopics(items);
        setAuthenticationRequired(false);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setTopicsError(getApiErrorMessage(error, t('Không thể tải danh sách chủ đề.')));
      })
      .finally(() => {
        if (!controller.signal.aborted) setTopicsLoading(false);
      });
    return () => controller.abort();
  }, [subjectId, topicsRetryKey, t]);

  useEffect(() => {
    if (!subjectId || !topicId) {
      setDocuments([]);
      setSelectedDocumentIds([]);
      setDocumentsError('');
      setDocumentsLoading(false);
      return;
    }
    const controller = new AbortController();
    setDocumentsLoading(true);
    setDocumentError('');
    setDocumentsError('');
    getQuestionDocuments(subjectId, topicId, controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setDocuments(items);
        setAuthenticationRequired(false);
        setSelectedDocumentIds((current) => current.filter((id) => items.some((item) => item.documentId === id)));
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setDocumentsError(getApiErrorMessage(error, t('Không thể tải dữ liệu.')));
      })
      .finally(() => {
        if (!controller.signal.aborted) setDocumentsLoading(false);
      });
    return () => controller.abort();
  }, [subjectId, topicId, documentsRetryKey, t]);

  useEffect(() => {
    const pending = documents.filter((document) => document.status === 'UPLOADED' || document.status === 'PROCESSING');
    if (!pending.length) return;
    let active = true;
    let timer: number | undefined;
    const controller = new AbortController();
    const pollDocuments = async () => {
      try {
        const updates = await Promise.all(pending.map((document) => getQuestionDocument(document.documentId, controller.signal)));
        if (!active) return;
        const byId = new Map(updates.map((document) => [document.documentId, document]));
        setDocuments((current) => current.map((document) => byId.get(document.documentId) ?? document));
        if (updates.some((document) => document.status === 'UPLOADED' || document.status === 'PROCESSING')) {
          timer = window.setTimeout(pollDocuments, DOCUMENT_POLL_MS);
        }
      } catch {
        if (active) timer = window.setTimeout(pollDocuments, DOCUMENT_POLL_MS);
      }
    };
    timer = window.setTimeout(pollDocuments, DOCUMENT_POLL_MS);
    return () => {
      active = false;
      controller.abort();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [documents]);

  useEffect(() => {
    if (!storedJobId || job) return;
    if (jobStartedAt.current === null) jobStartedAt.current = Date.now();
    const controller = new AbortController();
    getQuestionGenerationJob(storedJobId, controller.signal)
      .then((loadedJob) => {
        setJob(loadedJob);
        setPollUnavailable(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setPollUnavailable(true);
      });
    return () => controller.abort();
  }, [storedJobId, job, pollCycle]);

  useEffect(() => {
    if (!job || job.status === 'DONE' || job.status === 'FAILED' || pollTimedOut || pollUnavailable) return;
    if (jobStartedAt.current === null) jobStartedAt.current = Date.now();
    const elapsed = Date.now() - jobStartedAt.current;
    if (elapsed >= JOB_WAIT_LIMIT_MS) {
      setPollTimedOut(true);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const updated = await getQuestionGenerationJob(job.jobId, controller.signal);
        if (!controller.signal.aborted) {
          setJob(updated);
          setJobError('');
        }
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setPollUnavailable(true);
          setJobError(t('Không tìm thấy trạng thái công việc. Câu hỏi đã lưu vẫn có thể xem trong danh sách.'));
        } else {
          setJobError(getQuestionGenerationErrorMessage(error, t('Không thể cập nhật trạng thái công việc.')));
          setPollCycle((cycle) => cycle + 1);
        }
      }
    }, Math.min(JOB_POLL_MS, Math.max(0, JOB_WAIT_LIMIT_MS - elapsed)));
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [job, pollTimedOut, pollUnavailable, pollCycle, t]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!subjectId || !topicId) {
      setDocumentError(t('Vui lòng chọn môn học và chủ đề trước.'));
      return;
    }
    if (!files.length) return;
    setUploading(true);
    setDocumentError('');
    const fileRows = files.map((file) => {
      uploadSequence.current += 1;
      return { id: `${Date.now()}-${uploadSequence.current}`, filename: file.name };
    });
    setUploadingFiles((current) => [...current, ...fileRows]);
    await Promise.all(files.map(async (file, index) => {
      const row = fileRows[index];
      try {
        const document = await uploadQuestionDocument(subjectId, topicId, file);
        setAuthenticationRequired(false);
        setDocuments((current) => [...current.filter((item) => item.documentId !== document.documentId), document]);
        setUploadingFiles((current) => current.filter((item) => item.id !== row.id));
      } catch (error: unknown) {
        const message = getApiErrorMessage(error, t('Không thể tải lên tài liệu.'));
        setUploadingFiles((current) => current.map((item) => item.id === row.id ? { ...item, error: message } : item));
      }
    }));
    setUploading(false);
  };

  const toggleDocument = (documentId: string) => {
    setSelectedDocumentIds((current) => current.includes(documentId)
      ? current.filter((id) => id !== documentId)
      : [...current, documentId]);
  };

  const removeDocument = async (document: QuestionDocument) => {
    if (!window.confirm(`${t('Bạn có chắc muốn xóa tài liệu này?')} "${document.filename}"`)) return;
    setDocumentError('');
    try {
      await deleteQuestionDocument(document.documentId);
      setAuthenticationRequired(false);
      setDocuments((current) => current.filter((item) => item.documentId !== document.documentId));
      setSelectedDocumentIds((current) => current.filter((id) => id !== document.documentId));
    } catch (error: unknown) {
      setDocumentError(getApiErrorMessage(error, t('Không thể xóa tài liệu.')));
    }
  };

  const handleCreateJob = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPageError('');
    const readyIds = selectedDocumentIds.filter((id) => documents.some((document) => document.documentId === id && document.status === 'READY'));
    if (!subjectId || !topicId) {
      setPageError(t('Vui lòng chọn môn học và chủ đề trước.'));
      return;
    }
    if (!readyIds.length) {
      setPageError(t('Chọn ít nhất một tài liệu sẵn sàng.'));
      return;
    }
    if (Object.values(bloomDistribution).reduce((sum, value) => sum + value, 0) !== numberOfQuestions) {
      setPageError(t('Phân bổ Bloom phải bằng tổng số câu hỏi.'));
      return;
    }
    if (generateRubric && rubricTotalPoints <= 0) {
      setPageError(t('Tổng điểm rubric phải lớn hơn 0.'));
      return;
    }
    const payload: CreateGenerationJobRequest = {
      subjectId,
      topicId,
      documentIds: readyIds,
      numberOfQuestions,
      bloomDistribution,
      language: generationLanguage,
      generateRubric,
      rubricTotalPoints: Number(rubricTotalPoints) || 10,
    };
    setJobCreating(true);
    setJobError('');
    setPollTimedOut(false);
    setPollUnavailable(false);
    try {
      const created = await createQuestionGenerationJob(payload);
      setJob(created);
      setStoredJobId(created.jobId);
      jobStartedAt.current = Date.now();
      setPollCycle((cycle) => cycle + 1);
      try {
        localStorage.setItem(JOB_STORAGE_KEY, created.jobId);
      } catch {
        // The job remains available in this page if browser storage is blocked.
      }
    } catch (error: unknown) {
      const message = getQuestionGenerationErrorMessage(error, t('Không thể thực hiện thao tác.'));
      const retryAfter = getQuestionGenerationRetryAfter(error);
      setPageError(retryAfter ? `${message} ${t('Thử lại sau')}: ${retryAfter}` : message);
    } finally {
      setJobCreating(false);
    }
  };

  const resumeTracking = () => {
    const id = job?.jobId ?? storedJobId;
    if (!id) return;
    setPollTimedOut(false);
    setPollUnavailable(false);
    setJobError('');
    jobStartedAt.current = Date.now();
    setPollCycle((cycle) => cycle + 1);
  };

  const readyDocumentCount = documents.filter((document) => document.status === 'READY').length;
  const selectedReadyCount = selectedDocumentIds.filter((id) => documents.some((document) => document.documentId === id && document.status === 'READY')).length;
  const reviewJobId = job?.jobId ?? storedJobId;
  const canShowDrafts = Boolean(subjectId && topicId) || Boolean(reviewJobId);

  const handleSubjectChange = (nextSubjectId: string) => {
    setSubjectId(nextSubjectId);
    setTopicId('');
    setTopics([]);
    setTopicsError('');
    setDocuments([]);
    setSelectedDocumentIds([]);
    setDocumentError('');
    setDocumentsError('');
  };

  const handleTopicChange = (nextTopicId: string) => {
    setTopicId(nextTopicId);
    setDocuments([]);
    setSelectedDocumentIds([]);
    setDocumentError('');
    setDocumentsError('');
  };

  const PageShell = embedded ? 'div' : 'main';

  return (
    <PageShell className={embedded ? 'qg-page qg-page-embedded' : 'qg-page'}>
      {!embedded && <PageHeader title="Tạo câu hỏi AI / RAG" description="Chọn môn học, chủ đề và tài liệu đã được kiểm tra để tạo bản nháp câu hỏi." />}
      {pageError && <p className="qg-error" role="alert">{pageError}</p>}
      {authenticationRequired && <p className="qg-error" role="alert">{t('Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.')} <Link to={APP_ROUTES.login}>{t('Đăng nhập')}</Link></p>}

      <section className="qg-section" aria-labelledby="qg-scope-heading">
        <div className="qg-section-heading"><h2 id="qg-scope-heading">{t('Môn học')} &amp; {t('Chủ đề')}</h2></div>
        <div className="qg-form">
          <div className="qg-field">
            <label htmlFor="qg-subject">{t('Môn học')}</label>
            <select id="qg-subject" className="qg-control" value={subjectId} disabled={subjectsLoading || uploading} onChange={(event) => handleSubjectChange(event.target.value)}>
              <option value="">{subjectsLoading ? `${t('Đang tải')}...` : t('Chọn môn học')}</option>
              {subjects.map((subject) => <option key={subject.subjectId} value={subject.subjectId}>{subject.subjectCode} · {subject.subjectName}</option>)}
            </select>
          </div>
          <div className="qg-field">
            <label htmlFor="qg-topic">{t('Chủ đề')}</label>
            <select id="qg-topic" className="qg-control" value={topicId} disabled={!subjectId || topicsLoading || uploading} onChange={(event) => handleTopicChange(event.target.value)}>
              <option value="">{topicsLoading ? `${t('Đang tải')}...` : t('Chọn chủ đề')}</option>
              {topics.map((topic) => <option key={topic.topicId} value={topic.topicId}>{topic.topicCode} · {topic.topicName}</option>)}
            </select>
          </div>
          {subjectsError && <ScopeNotice variant="error" actionLabel={t('Thử lại')} onAction={() => setSubjectsRetryKey((key) => key + 1)}>{subjectsError}</ScopeNotice>}
          {!subjectsLoading && !subjectsError && subjects.length === 0 && <ScopeNotice variant="info">{t('Không có môn học nào được gán cho tài khoản giảng viên đang đăng nhập. Vui lòng nhờ quản trị viên xác nhận phân công môn học.')}</ScopeNotice>}
          {topicsError && <ScopeNotice variant="error" actionLabel={t('Thử lại')} onAction={() => setTopicsRetryKey((key) => key + 1)}>{topicsError}</ScopeNotice>}
          {!topicsLoading && subjectId && !topicsError && topics.length === 0 && <ScopeNotice variant="info">{t('Không có chủ đề nào trong môn học này.')}</ScopeNotice>}
        </div>
      </section>

      <section className="qg-section" aria-labelledby="qg-documents-heading">
        <div className="qg-section-heading">
          <div><h2 id="qg-documents-heading">{t('Tài liệu học phần')}</h2><p>{t('Chỉ tài liệu sẵn sàng mới được chọn.')}</p></div>
          {readyDocumentCount > 0 && <span className="qg-status qg-status-ready">{t('Sẵn sàng')}: {readyDocumentCount}</span>}
        </div>
        <label className="qg-field qg-upload-field">
          <span>{t('Tải PDF, PPTX hoặc DOCX')}</span>
          <input className="qg-control" type="file" accept=".pdf,.pptx,.docx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple disabled={!subjectId || !topicId || uploading || documentsLoading} onChange={handleUpload} />
        </label>
        {documentError && <p className="qg-error" role="alert">{documentError}</p>}
        {documentsError && <p className="qg-error" role="alert">{documentsError}</p>}
        {documentsError && <button type="button" className="qg-text-link" onClick={() => setDocumentsRetryKey((key) => key + 1)}>{t('Thử lại')}</button>}
        {documentsLoading && <p className="qg-muted" role="status">{t('Đang tải')}...</p>}
        {uploadingFiles.length > 0 && <div className="qg-document-list" aria-live="polite">
          {uploadingFiles.map((file) => <div className="qg-document-row" key={file.id}>
            <div className="qg-document-main"><div><strong>{file.filename}</strong><small>{file.error ? file.error : `${t('Đang tải lên')}...`}</small></div></div>
            <span className={file.error ? 'qg-status qg-status-failed' : 'qg-status qg-status-processing'}>{file.error ? t('Thất bại') : t('Đang tải lên')}</span>
          </div>)}
        </div>}
        {!documentsLoading && !documentsError && !documents.length && subjectId && topicId && <p className="qg-empty">{t('Không có dữ liệu phù hợp.')}</p>}
        {documents.length > 0 && <div className="qg-document-list">
          {documents.map((document) => <div className="qg-document-row" key={document.documentId}>
            <label className="qg-document-main">
              <input type="checkbox" checked={selectedDocumentIds.includes(document.documentId)} disabled={document.status !== 'READY'} onChange={() => toggleDocument(document.documentId)} />
              <div><strong>{document.filename}</strong><small>{t('Đã tải lên')}: {new Date(document.uploadedAt).toLocaleString()}</small>
                {document.errorReason && <small className="qg-error">{document.errorReason}</small>}
              </div>
            </label>
            <span className={statusClass(document.status)}>{documentStatusLabel(document.status, t)}</span>
            <div className="qg-document-meta">{formatSize(document.size)} · {document.contentType}<br />
              <button type="button" className="qg-text-link" onClick={() => removeDocument(document)}>{t('Xóa tài liệu')}</button>
            </div>
          </div>)}
        </div>}
      </section>

      <section className="qg-section" aria-labelledby="qg-config-heading">
        <div className="qg-section-heading"><div><h2 id="qg-config-heading">{t('Cấu hình sinh câu hỏi')}</h2><p>{t('Tài liệu sử dụng')}: {selectedReadyCount}</p></div></div>
        <form className="qg-form" onSubmit={handleCreateJob}>
          <label className="qg-field">
            <span>{t('Số câu hỏi')}</span>
            <input className="qg-control" type="number" min="1" step="1" required value={numberOfQuestions} onChange={(event) => setNumberOfQuestions(Number(event.target.value))} />
          </label>
          <label className="qg-field">
            <span>{t('Ngôn ngữ câu hỏi')}</span>
            <select className="qg-control" value={generationLanguage} onChange={(event) => setGenerationLanguage(event.target.value as 'vi' | 'en')}>
              <option value="vi">{t('Tiếng Việt')}</option><option value="en">English</option>
            </select>
          </label>
          <div className="qg-field qg-field-wide">
            <span>{t('Phân bổ Bloom')}</span>
            <div className="qg-form qg-bloom-grid">
              {BLOOM_LEVELS.map((level) => <label className="qg-field" key={level}>
                <span>{level}</span>
                <input className="qg-control" type="number" min="0" max={numberOfQuestions} step="1" required value={bloomDistribution[level]} onChange={(event) => setBloomDistribution((current) => ({ ...current, [level]: Number(event.target.value) }))} />
              </label>)}
            </div>
            <small className={Object.values(bloomDistribution).reduce((sum, value) => sum + value, 0) === numberOfQuestions ? 'qg-total-valid' : 'qg-total-invalid'}>
              {Object.values(bloomDistribution).reduce((sum, value) => sum + value, 0)} / {numberOfQuestions}
            </small>
          </div>
          <label className="qg-field qg-rubric-toggle">
            <span><input type="checkbox" checked={generateRubric} onChange={(event) => setGenerateRubric(event.target.checked)} /> {t('Sinh rubric')}</span>
          </label>
          <label className="qg-field">
            <span>{t('Tổng điểm rubric')}</span>
            <input className="qg-control" type="number" min="1" step="any" disabled={!generateRubric} value={rubricTotalPoints} onChange={(event) => setRubricTotalPoints(Number(event.target.value))} />
          </label>
          <div className="qg-field-wide qg-form-footer">
            <span className="qg-muted">{t('Chỉ tài liệu sẵn sàng mới được chọn.')}</span>
            <button className="qg-button" type="submit" disabled={jobCreating || selectedReadyCount === 0 || !subjectId || !topicId}>
              {jobCreating ? t('Đang tải') : t('Tạo yêu cầu sinh')}
            </button>
          </div>
        </form>
      </section>

      {(job || storedJobId) && <section className="qg-section" aria-labelledby="qg-job-heading">
        <div className="qg-section-heading"><h2 id="qg-job-heading">{t('Tiến độ sinh câu hỏi')}</h2></div>
        {job && <div className="qg-job-progress">
          <div className="qg-job-meta">
            <span className={statusClass(job.status)}>{jobStatusLabel(job.status, t)}</span>
            <span>{t('Tiến độ sinh câu hỏi')}: {job.progress}%</span>
            <span>{t('Đã sinh')}: {job.generatedCount}</span>
            <span>{t('ID công việc')}: {job.jobId}</span>
          </div>
          <progress max={100} value={Math.min(100, Math.max(0, job.progress))}>{job.progress}%</progress>
          {job.error && <p className="qg-job-error"><strong>{t('Lỗi sinh câu hỏi')}:</strong> {job.error}</p>}
          {job.status === 'FAILED' && job.questionIds.length > 0 && <p className="qg-muted">{t('Câu hỏi')}: {job.questionIds.map((id, index) => <span key={id}>{index > 0 ? ', ' : ''}<Link className="qg-text-link" to={`${APP_ROUTES.lecturer.questions}/${encodeURIComponent(id)}`}>{id}</Link></span>)}</p>}
        </div>}
        {!job && storedJobId && <p className="qg-job-error">{jobError || t('Không tìm thấy trạng thái công việc. Câu hỏi đã lưu vẫn có thể xem trong danh sách.')} ({storedJobId})</p>}
        {pollTimedOut && <p className="qg-muted">{t('Đã hết thời gian chờ. Có thể tiếp tục theo dõi bằng mã công việc.')}</p>}
        {jobError && job && <p className="qg-job-error" role="alert">{jobError}</p>}
        {(pollTimedOut || pollUnavailable) && <button type="button" className="qg-button qg-button-secondary" onClick={resumeTracking}>{t('Tiếp tục theo dõi')}</button>}
      </section>}

      {canShowDrafts && <QuestionReviewList
        key={`${reviewJobId}-${subjectId}-${topicId}`}
        jobId={reviewJobId || undefined}
        subjectId={reviewJobId ? undefined : subjectId || undefined}
        topicId={reviewJobId ? undefined : topicId || undefined}
        refreshToken={job ? `${job.status}-${job.generatedCount}` : ''}
      />}
    </PageShell>
  );
}
