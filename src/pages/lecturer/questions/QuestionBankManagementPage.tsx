import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { ROLES } from '../../../constants/roles';
import { useLanguage } from '../../../context/LanguageContext';
import useQuestionBank from '../../../hooks/useQuestionBank';
import useRubricTopics from '../../../hooks/useRubricTopics';
import { useAuth } from '../../../hooks/useAuth';
import { BLOOM_LEVELS, type BloomLevel, type Criterion } from '../../../types/rubric';
import type { ApprovalStatus, GenerationJob, QuestionBankItem, QuestionRubricResponse } from '../../../types/question';
import GenerateQuestionPage from './GenerateQuestionPage';
import './QuestionBankManagementPage.css';
import './QuestionBankViews.css';

const BLOOM_LABELS: Record<BloomLevel, string> = { REMEMBER: 'Nhớ', UNDERSTAND: 'Hiểu', APPLY: 'Vận dụng', ANALYZE: 'Phân tích', EVALUATE: 'Đánh giá', CREATE: 'Sáng tạo' };
const STATUS_LABELS: Record<string, string> = { DRAFT: 'Bản nháp', PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', ARCHIVED: 'Đã lưu trữ' };
const APPROVAL_STATUSES: ApprovalStatus[] = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'];
type QuestionBankView = 'bank' | 'create';
type DraftCriterion = Pick<Criterion, 'criteriaName' | 'expectedKnowledgePoints' | 'weightRatio'>;

const emptyCriterion = (): DraftCriterion => ({ criteriaName: '', expectedKnowledgePoints: '', weightRatio: 0 });
const sourceLabel = (source?: string) => source === 'QUESTION_OVERRIDE' ? 'Ghi đè' : 'Môn học';

export default function QuestionBankManagementPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const role = String(user?.role ?? '').toUpperCase();
  const canWrite = ['ADMIN', ROLES.LECTURER, 'AD', 'LE'].includes(role);
  const canGenerateQuestions = role === ROLES.LECTURER || role === 'LE';
  const [activeView, setActiveView] = useState<QuestionBankView>('bank');
  const topicsCatalog = useRubricTopics();
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [bloomLevel, setBloomLevel] = useState<BloomLevel | ''>('');
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | ''>('');
  const [generationRefresh, setGenerationRefresh] = useState(0);
  const query = useMemo(() => ({ topicId: topicId || undefined, bloomLevel: bloomLevel || undefined, approvalStatus: approvalStatus || undefined }), [approvalStatus, bloomLevel, generationRefresh, topicId]);
  const bank = useQuestionBank(query, canWrite);
  const [selected, setSelected] = useState<QuestionBankItem | null>(null);
  const [rubric, setRubric] = useState<QuestionRubricResponse | null>(null);
  const [criteria, setCriteria] = useState<DraftCriterion[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const refreshQuestions = useCallback((job: GenerationJob) => {
    setSubjectId(job.subjectId);
    topicsCatalog.setSubjectId(job.subjectId);
    setTopicId(job.topicId);
    setBloomLevel('');
    setApprovalStatus('DRAFT');
    setGenerationRefresh((current) => current + 1);
  }, [topicsCatalog.setSubjectId]);

  useEffect(() => {
    if (!selected) return undefined;
    let active = true;
    setDetailLoading(true); setDetailError(''); setSaveError(''); setSuccess(''); setRubric(null);
    bank.loadRubric(selected.questionId)
      .then((response) => { if (active) { setRubric(response); setCriteria(response.criteria.map(({ criteriaName, expectedKnowledgePoints, weightRatio }) => ({ criteriaName, expectedKnowledgePoints, weightRatio }))); } })
      .catch((error) => { if (active) setDetailError(error instanceof Error ? error.message : 'Không thể tải rubric câu hỏi.'); })
      .finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [bank.loadRubric, selected]);

  const total = criteria.reduce((sum, item) => sum + (Number(item.weightRatio) || 0), 0);
  const updateCriterion = (index: number, field: keyof DraftCriterion, value: string) => setCriteria((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: field === 'weightRatio' ? Number(value) : value } : item));
  const save = async (nextCriteria: DraftCriterion[] = criteria) => {
    if (!selected || !canWrite) return;
    setSaving(true); setSaveError(''); setSuccess('');
    try {
      const response = await bank.saveOverride(selected.questionId, { criteria: nextCriteria.map(({ criteriaName, expectedKnowledgePoints, weightRatio }) => ({ criteriaName: criteriaName.trim(), expectedKnowledgePoints: expectedKnowledgePoints.trim(), weightRatio: Number(weightRatio) })) });
      setRubric(response); setCriteria(response.criteria.map(({ criteriaName, expectedKnowledgePoints, weightRatio }) => ({ criteriaName, expectedKnowledgePoints, weightRatio })));
      setSuccess(nextCriteria.length ? 'Đã lưu rubric ghi đè.' : 'Đã xóa rubric ghi đè.');
    } catch (error) { setSaveError(error instanceof Error ? error.message : 'Không thể lưu rubric ghi đè.'); }
    finally { setSaving(false); }
  };

  return (
    <main className="question-bank-management-page">
      <PageHeader title="Ngân hàng câu hỏi" description="Lọc câu hỏi theo chủ đề, Bloom và trạng thái duyệt; xem hoặc ghi đè rubric." />
      <div className="question-bank-view-tabs" role="tablist" aria-label={t('Chức năng ngân hàng câu hỏi')}>
        <button
          id="question-bank-view-bank"
          className={`question-bank-view-tab${activeView === 'bank' ? ' active' : ''}`}
          type="button"
          role="tab"
          aria-selected={activeView === 'bank'}
          aria-controls="question-bank-panel-bank"
          tabIndex={activeView === 'bank' ? 0 : -1}
          onClick={() => setActiveView('bank')}
        >{t('Ngân hàng câu hỏi')}</button>
        {canGenerateQuestions && <button
          id="question-bank-view-create"
          className={`question-bank-view-tab${activeView === 'create' ? ' active' : ''}`}
          type="button"
          role="tab"
          aria-selected={activeView === 'create'}
          aria-controls="question-bank-panel-create"
          tabIndex={activeView === 'create' ? 0 : -1}
          onClick={() => setActiveView('create')}
        >{t('Tạo câu hỏi')}</button>}
      </div>
      {activeView === 'create' && canGenerateQuestions ? <section id="question-bank-panel-create" className="question-bank-create-panel" role="tabpanel" aria-labelledby="question-bank-view-create">
        <GenerateQuestionPage embedded singleBloom onGenerationComplete={refreshQuestions} />
      </section> : <div id="question-bank-panel-bank" role="tabpanel" aria-labelledby="question-bank-view-bank">
      <section className="question-filters">
        <label>Môn học<select value={subjectId} disabled={topicsCatalog.loading} onChange={(event) => { setSubjectId(event.target.value); setTopicId(''); topicsCatalog.setSubjectId(event.target.value); }}><option value="">Tất cả môn học</option>{topicsCatalog.subjects.map((subject) => <option key={subject.subjectId} value={subject.subjectId}>{subject.subjectCode} · {subject.subjectName}</option>)}</select></label>
        <label>Chủ đề<select value={topicId} disabled={!subjectId || topicsCatalog.topicsLoading} onChange={(event) => setTopicId(event.target.value)}><option value="">Tất cả chủ đề</option>{topicsCatalog.topics.map((topic) => <option key={topic.topicId} value={topic.topicId}>{topic.topicCode} · {topic.topicName}</option>)}</select></label>
        <label>Mức Bloom<select value={bloomLevel} onChange={(event) => setBloomLevel(event.target.value as BloomLevel | '')}><option value="">Tất cả mức</option>{BLOOM_LEVELS.map((level) => <option key={level} value={level}>{BLOOM_LABELS[level]}</option>)}</select></label>
        <label>Trạng thái duyệt<select value={approvalStatus} onChange={(event) => setApprovalStatus(event.target.value as ApprovalStatus | '')}><option value="">Tất cả trạng thái</option>{APPROVAL_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select></label>
      </section>
      {(topicsCatalog.error || topicsCatalog.topicsError) && <div className="inline-error" role="alert">{topicsCatalog.error || topicsCatalog.topicsError}<button type="button" className="link-button" onClick={topicsCatalog.retry}>Thử lại</button></div>}
      {!canWrite && <p className="readonly-notice" role="status">Tài khoản ST chỉ được xem, thao tác ghi override đã bị khóa.</p>}
      {bank.error && <div className="inline-error" role="alert">{bank.error}<button type="button" className="link-button" onClick={bank.retry}>Thử lại</button></div>}
      {bank.loading && <p className="loading-message" role="status">Đang tải ngân hàng câu hỏi...</p>}
      {!bank.loading && !bank.error && !bank.questions.length && <div className="empty-message" role="status">Không có câu hỏi phù hợp.</div>}
      {!bank.loading && bank.questions.length > 0 && <section className="question-table-panel"><table className="question-table"><thead><tr><th>Câu hỏi</th><th>Bloom</th><th>Trạng thái duyệt</th><th>Thao tác</th></tr></thead><tbody>{bank.questions.map((question) => <tr key={question.questionId} className={selected?.questionId === question.questionId ? 'selected' : undefined}><td>{question.questionText}</td><td><span className={`bloom-badge bloom-${question.bloomLevel.toLowerCase()}`}>{BLOOM_LABELS[question.bloomLevel as BloomLevel] ?? question.bloomLevel}</span></td><td>{STATUS_LABELS[question.approvalStatus] ?? question.approvalStatus}</td><td><button type="button" className="secondary-button" onClick={() => setSelected(question)}>Mở rubric</button></td></tr>)}</tbody></table></section>}
      {detailLoading && <p className="loading-message" role="status">Đang tải rubric câu hỏi...</p>}
      {detailError && <div className="inline-error" role="alert">{detailError}<button type="button" className="link-button" onClick={() => selected && setSelected({ ...selected })}>Thử lại</button></div>}
      {selected && !detailLoading && !detailError && rubric && <section className="question-rubric-panel" aria-labelledby="question-rubric-title"><div className="detail-heading"><div><h2 id="question-rubric-title">Rubric câu hỏi</h2><p>{selected.questionText}</p></div><span className={`source-badge ${rubric.source.toLowerCase()}`}>{sourceLabel(rubric.source)}</span></div><div className="criteria-table-wrap"><table className="criteria-table"><thead><tr><th>Tên tiêu chí</th><th>Kiến thức kỳ vọng</th><th>Tỷ trọng</th><th /></tr></thead><tbody>{criteria.map((criterion, index) => <tr key={index}><td><input aria-label={`Tên tiêu chí override ${index + 1}`} value={criterion.criteriaName} onChange={(event) => updateCriterion(index, 'criteriaName', event.target.value)} /></td><td><input aria-label={`Kiến thức kỳ vọng override ${index + 1}`} value={criterion.expectedKnowledgePoints} onChange={(event) => updateCriterion(index, 'expectedKnowledgePoints', event.target.value)} /></td><td><input aria-label={`Tỷ trọng override ${index + 1}`} type="number" min="0" max="1" step="0.01" value={criterion.weightRatio} onChange={(event) => updateCriterion(index, 'weightRatio', event.target.value)} /></td><td><button type="button" className="icon-button danger" aria-label={`Xóa tiêu chí override ${index + 1}`} onClick={() => setCriteria((current) => current.filter((_, itemIndex) => itemIndex !== index))}>×</button></td></tr>)}</tbody></table></div><div className="override-actions"><span>Tổng trọng số: <strong>{total.toFixed(2)}</strong></span><button type="button" className="secondary-button" disabled={!canWrite} onClick={() => setCriteria((current) => [...current, emptyCriterion()])}>+ Thêm tiêu chí</button><button type="button" className="secondary-button danger-button" disabled={!canWrite || saving} onClick={() => void save([])}>Xóa override</button><button type="button" className="primary-button" disabled={!canWrite || saving || Math.abs(total - 1) >= 0.0001 || criteria.some((criterion) => !criterion.criteriaName.trim())} onClick={() => void save()}>{saving ? 'Đang lưu...' : 'Lưu override'}</button></div>{saveError && <p className="field-error" role="alert">{saveError}</p>}{success && <p className="success-message" role="status">{success}</p>}</section>}
      </div>}
    </main>
  );
}
