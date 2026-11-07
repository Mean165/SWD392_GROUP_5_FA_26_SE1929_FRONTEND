import { useEffect, useState, type FormEvent } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import { getRubricApiError, getRubricSubjects } from '../../../api/rubricApi';
import useRubrics from '../../../hooks/useRubrics';
import { BLOOM_LEVELS, type BloomLevel, type SubjectRubricInput } from '../../../types/rubric';
import type { SubjectOption } from '../../../types/question';
import './SubjectRubricPage.css';
import './SubjectRubricPageForm.css';

const LABELS: Record<BloomLevel, string> = { REMEMBER: 'Nhớ', UNDERSTAND: 'Hiểu', APPLY: 'Vận dụng', ANALYZE: 'Phân tích', EVALUATE: 'Đánh giá', CREATE: 'Sáng tạo' };
type Draft = { criteriaName: string; expectedKnowledgePoints: string; weightRatio: string };
const blank = (): Draft => ({ criteriaName: '', expectedKnowledgePoints: '', weightRatio: '0.00' });
const validRatio = (value: string) => /^(?:0?\.\d{1,2}|1(?:\.0{1,2})?|0)$/.test(value);
const toPayload = (name: string, description: string, criteria: Draft[]): SubjectRubricInput => ({
  name: name.trim(), description: description.trim() || null,
  criteria: criteria.map((item) => ({ criteriaName: item.criteriaName.trim(), expectedKnowledgePoints: item.expectedKnowledgePoints.trim(), weightRatio: Number(Number(item.weightRatio).toFixed(2)) })),
});

export default function SubjectRubricPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const canWrite = ['ADMIN', 'LECTURER', 'AD', 'LE'].includes(String(user?.role ?? '').toUpperCase());
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retrySubjects, setRetrySubjects] = useState(0);
  const rubricState = useRubrics(subjectId);
  const rubric = rubricState.rubric;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState<Draft[]>([blank()]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failure, setFailure] = useState('');

  useEffect(() => {
    let active = true;
    setSubjectsLoading(true); setLoadError(false);
    getRubricSubjects().then((items) => { if (active) { setSubjects(items); if (!subjectId && items[0]) setSubjectId(items[0].subjectId); } })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setSubjectsLoading(false); });
    return () => { active = false; };
  }, [retrySubjects]);

  useEffect(() => {
    if (!rubric) return;
    setName(rubric.name); setDescription(rubric.description ?? '');
    setCriteria(rubric.criteria.length ? rubric.criteria.map((item) => ({ criteriaName: item.criteriaName, expectedKnowledgePoints: item.expectedKnowledgePoints, weightRatio: Number(item.weightRatio).toFixed(2) })) : [blank()]);
  }, [rubric]);

  const total = criteria.reduce((sum, row) => sum + (Number(row.weightRatio) || 0), 0);
  const weightsValid = criteria.length > 0 && criteria.every((row) => validRatio(row.weightRatio) && Number(row.weightRatio) > 0);
  const fieldsValid = criteria.every((row) => row.criteriaName.trim() && row.expectedKnowledgePoints.trim());
  const canSubmit = canWrite && !busy && Boolean(name.trim()) && fieldsValid && weightsValid && Math.round(total * 100) === 100;
  const startCreate = () => { setName(''); setDescription(''); setCriteria([blank()]); setEditing(true); setMessage(''); setFailure(''); };
  const startEdit = () => { if (!rubric) return; setName(rubric.name); setDescription(rubric.description ?? ''); setCriteria(rubric.criteria.map((item) => ({ criteriaName: item.criteriaName, expectedKnowledgePoints: item.expectedKnowledgePoints, weightRatio: Number(item.weightRatio).toFixed(2) }))); setEditing(true); setMessage(''); setFailure(''); };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!canSubmit) return;
    setBusy(true); setFailure(''); setMessage('');
    try {
      const payload = toPayload(name, description, criteria);
      await (rubric ? rubricState.update(payload) : rubricState.create(payload));
      setMessage(t('Rubric saved successfully.')); setEditing(false);
    } catch (error) {
      const details = getRubricApiError(error);
      setFailure(details.status === 409 ? t('An active rubric already exists for this subject.') : details.status === 400 ? t('The subject rubric has invalid criteria or weights.') : t('Rubric could not be saved.'));
    } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!window.confirm(t('Archive this subject rubric?'))) return;
    setBusy(true); setFailure(''); setMessage('');
    try { await rubricState.archive(); setMessage(t('Rubric archived successfully.')); setEditing(false); }
    catch { setFailure(t('Rubric could not be saved.')); }
    finally { setBusy(false); }
  };

  return <main className="rubric-management-page">
    <PageHeader title={t('Subject rubric')} description={t('Assessment criteria applied across the selected subject.')} />
    <section className="topic-picker-panel"><label>{t('Subject')}<select value={subjectId} disabled={subjectsLoading || busy} onChange={(event) => { setSubjectId(event.target.value); setEditing(false); setMessage(''); setFailure(''); }}><option value="">{t('Select a subject')}</option>{subjects.map((subject) => <option key={subject.subjectId} value={subject.subjectId}>{subject.subjectCode} · {subject.subjectName}</option>)}</select></label>
      {loadError && <div role="alert">{t('Could not load subjects.')} <button type="button" onClick={() => setRetrySubjects((key) => key + 1)}>{t('Try again')}</button></div>}
    </section>
    {!canWrite && <p role="status">{t('This account can view rubrics but cannot edit them.')}</p>}
    {message && <p role="status">{message}</p>}{failure && <p role="alert">{failure}</p>}
    {subjectId && rubricState.loading && <p role="status">{t('Loading subject rubric...')}</p>}
    {subjectId && rubricState.error && <div role="alert">{t('Could not load subject rubric.')} <button type="button" onClick={rubricState.retry}>{t('Try again')}</button></div>}
    {subjectId && !rubricState.loading && !rubricState.error && <>
      {!rubric && !editing && <section className="rubric-editor"><h2>{t('No active rubric')}</h2><p>{t('This subject does not have an active rubric.')}</p><button type="button" className="primary-button" disabled={!canWrite} onClick={startCreate}>{t('Create rubric')}</button></section>}
      {rubric && !editing && <section className="rubric-editor"><div className="editor-heading"><div><h2>{rubric.name}</h2><p>{rubric.description}</p></div><span className="status-pill active">{t('Active')}</span></div>
        <div className="criteria-table-wrap"><table className="criteria-table"><thead><tr><th>{t('Criterion')}</th><th>{t('Expected knowledge points')}</th><th>{t('Weight')}</th></tr></thead><tbody>{rubric.criteria.map((item) => <tr key={item.criteriaId}><td>{item.criteriaName}</td><td>{item.expectedKnowledgePoints}</td><td>{(item.weightRatio * 100).toFixed(2)}%</td></tr>)}</tbody></table></div>
        <div className="editor-actions"><button type="button" className="secondary-button" disabled={!canWrite || busy} onClick={startEdit}>{t('Edit')}</button><button type="button" className="secondary-button danger" disabled={!canWrite || busy} onClick={() => void remove()}>{t('Archive')}</button></div>
      </section>}
      {editing && <form className="rubric-editor" onSubmit={submit}><div className="editor-heading"><h2>{rubric ? t('Edit subject rubric') : t('Create subject rubric')}</h2><button type="button" className="icon-button" aria-label={t('Close')} disabled={busy} onClick={() => setEditing(false)}>×</button></div>
        <label>{t('Rubric name')}<input required value={name} disabled={busy} onChange={(event) => setName(event.target.value)} /></label>
        <label>{t('Description')}<textarea rows={2} value={description} disabled={busy} onChange={(event) => setDescription(event.target.value)} /></label>
        <div className="criteria-heading"><h3>{t('Criteria')}</h3><button type="button" className="secondary-button" disabled={busy} onClick={() => setCriteria((rows) => [...rows, blank()])}>+ {t('Add criterion')}</button></div>
        <div className="criteria-table-wrap"><table className="criteria-table"><thead><tr><th>{t('Criterion name')}</th><th>{t('Expected knowledge points')}</th><th>{t('Weight (%)')}</th><th /></tr></thead><tbody>{criteria.map((row, index) => <tr key={index}><td><input aria-label={`${t('Criterion name')} ${index + 1}`} value={row.criteriaName} disabled={busy} onChange={(event) => setCriteria((all) => all.map((item, i) => i === index ? { ...item, criteriaName: event.target.value } : item))} /></td><td><input aria-label={`${t('Expected knowledge points')} ${index + 1}`} value={row.expectedKnowledgePoints} disabled={busy} onChange={(event) => setCriteria((all) => all.map((item, i) => i === index ? { ...item, expectedKnowledgePoints: event.target.value } : item))} /></td><td><input aria-label={`${t('Weight (%)')} ${index + 1}`} inputMode="decimal" min="0.01" max="100" step="any" value={row.weightRatio === '0.00' ? '' : String(Number(row.weightRatio) * 100)} disabled={busy} onChange={(event) => { const value = event.target.value; setCriteria((all) => all.map((item, i) => i === index ? { ...item, weightRatio: value === '' ? '0.00' : String(Number(value) / 100) } : item)); }} /></td><td><button type="button" className="icon-button danger" aria-label={`${t('Remove criterion')} ${index + 1}`} disabled={busy} onClick={() => setCriteria((all) => all.filter((_, i) => i !== index))}>×</button></td></tr>)}</tbody></table></div>
        <div className={`weight-total ${Math.round(total * 100) === 100 ? 'valid' : 'invalid'}`}>{t('Total weight')}: <strong>{(total * 100).toFixed(2)}%</strong> / 100.00%</div>
        {!criteria.length && <p role="alert">{t('At least one criterion is required.')}</p>}{criteria.length > 0 && !weightsValid && <p role="alert">{t('Each weight must be greater than 0 and have at most two decimal places.')}</p>}{weightsValid && Math.round(total * 100) !== 100 && <p role="alert">{t('Criterion weights must total 100%.')}</p>}
        <div className="editor-actions"><button type="button" className="secondary-button" disabled={busy} onClick={() => setEditing(false)}>{t('Cancel')}</button><button type="submit" className="primary-button" disabled={!canSubmit}>{busy ? t('Saving...') : t('Save rubric')}</button></div>
      </form>}
      <section className="rubric-editor"><h2>{t('Approved questions by Bloom level')}</h2><div className="exam-bloom-list">{BLOOM_LEVELS.map((level) => <span key={level} className="exam-bloom-badge">{LABELS[level]} ({level}): {rubricState.stats?.approvedQuestionsByBloom?.[level] ?? 0}</span>)}</div></section>
    </>}
  </main>;
}
