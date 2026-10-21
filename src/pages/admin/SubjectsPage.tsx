import { useCallback, useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';
import { useLanguage } from '../../context/LanguageContext';
import {
  addAdminSubjectTopics,
  createAdminSubject,
  getAdminSubjectById,
  getAdminSubjects,
  updateAdminSubject,
} from '../../services/system/systemService';
import type {
  AdminSubject,
  AdminSubjectRequest,
  AdminTopicRequest,
  CreateAdminSubjectRequest,
} from '../../types/system';
import { getAdminErrorMessage, isAdminUnauthorized } from '../../utils/adminError';
import useAdminSession from './useAdminSession';
import './SystemAdministration.css';
import './SubjectsPage.css';

type SubjectDialogMode = 'details' | 'edit' | 'create' | null;
type TopicDraft = { id: number; topicCode: string; topicName: string; description: string };

const emptyTopicDraft = (id: number): TopicDraft => ({ id, topicCode: '', topicName: '', description: '' });

function TopicDraftFields({
  draft,
  index,
  idPrefix,
  disabled,
  onChange,
  onRemove,
}: {
  draft: TopicDraft;
  index: number;
  idPrefix: string;
  disabled: boolean;
  onChange: (id: number, field: keyof Omit<TopicDraft, 'id'>, value: string) => void;
  onRemove: (id: number) => void;
}) {
  const { t } = useLanguage();
  const prefix = `${idPrefix}-${draft.id}`;

  return (
    <fieldset className="admin-subject-topic-row">
      <legend>{t('Chủ đề')} {index + 1}</legend>
      <div className="admin-subject-topic-fields">
        <div className="admin-subject-form-field">
          <label htmlFor={`${prefix}-code`}>{t('Mã chủ đề')}</label>
          <input id={`${prefix}-code`} value={draft.topicCode} maxLength={255} onChange={(event) => onChange(draft.id, 'topicCode', event.target.value)} disabled={disabled} />
        </div>
        <div className="admin-subject-form-field">
          <label htmlFor={`${prefix}-name`}>{t('Tên chủ đề')}</label>
          <input id={`${prefix}-name`} value={draft.topicName} maxLength={255} onChange={(event) => onChange(draft.id, 'topicName', event.target.value)} disabled={disabled} />
        </div>
        <div className="admin-subject-form-field topic-description">
          <label htmlFor={`${prefix}-description`}>{t('Mô tả chủ đề')}</label>
          <textarea id={`${prefix}-description`} value={draft.description} maxLength={2000} rows={2} onChange={(event) => onChange(draft.id, 'description', event.target.value)} disabled={disabled} />
        </div>
        <button type="button" className="admin-topic-remove-button" onClick={() => onRemove(draft.id)} disabled={disabled} aria-label={`${t('Bỏ chủ đề')} ${index + 1}`} title={t('Bỏ chủ đề')}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14M10 11v6m4-6v6M6.5 7l.8 13h9.4l.8-13M9 7V4h6v3" /></svg>
        </button>
      </div>
    </fieldset>
  );
}

function matchesKeyword(subject: AdminSubject, keyword: string): boolean {
  const normalized = keyword.trim().toLocaleLowerCase();
  if (!normalized) return true;
  return [subject.subjectCode, subject.subjectName, subject.description ?? '']
    .some((value) => value.toLocaleLowerCase().includes(normalized));
}

export default function SubjectsPage() {
  const { t } = useLanguage();
  const handleUnauthorized = useAdminSession();
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [subjects, setSubjects] = useState<AdminSubject[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  const [dialogMode, setDialogMode] = useState<SubjectDialogMode>(null);
  const [dialogSubjectId, setDialogSubjectId] = useState<string | null>(null);
  const [dialogSubject, setDialogSubject] = useState<AdminSubject | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [dialogRetryKey, setDialogRetryKey] = useState(0);
  const [formError, setFormError] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [topicDrafts, setTopicDrafts] = useState<TopicDraft[]>([]);
  const [isAddingTopics, setIsAddingTopics] = useState(false);
  const [isSavingTopics, setIsSavingTopics] = useState(false);
  const [topicFormError, setTopicFormError] = useState('');
  const topicDraftSequence = useRef(0);
  const unauthorizedStarted = useRef(false);

  const requestLogout = useCallback(async () => {
    if (unauthorizedStarted.current) return;
    unauthorizedStarted.current = true;
    await handleUnauthorized();
  }, [handleUnauthorized]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setIsLoading(true);
    setListError('');
    getAdminSubjects(debouncedKeyword, controller.signal)
      .then((items) => {
        if (active) setSubjects(items);
      })
      .catch((error: unknown) => {
        if (!active || controller.signal.aborted) return;
        setListError(getAdminErrorMessage(error, t));
        if (isAdminUnauthorized(error)) void requestLogout();
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [debouncedKeyword, requestLogout, retryKey, t]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => setSuccessMessage(''), 3500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!dialogMode || dialogMode === 'create' || !dialogSubjectId) return undefined;
    let active = true;
    const controller = new AbortController();
    setDialogLoading(true);
    setDialogError('');
    getAdminSubjectById(dialogSubjectId, controller.signal)
      .then((subject) => {
        if (!active) return;
        setDialogSubject(subject);
        if (dialogMode === 'edit') {
          setSubjectCode(subject.subjectCode);
          setSubjectName(subject.subjectName);
          setDescription(subject.description ?? '');
        }
      })
      .catch((error: unknown) => {
        if (!active || controller.signal.aborted) return;
        setDialogError(getAdminErrorMessage(error, t));
        if (isAdminUnauthorized(error)) void requestLogout();
      })
      .finally(() => {
        if (active) setDialogLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [dialogMode, dialogRetryKey, dialogSubjectId, requestLogout, t]);

  const openCreate = () => {
    setDialogMode('create');
    setDialogSubjectId(null);
    setDialogSubject(null);
    setDialogError('');
    setFormError('');
    setSubjectCode('');
    setSubjectName('');
    setDescription('');
    setTopicDrafts([]);
    setTopicFormError('');
    setIsAddingTopics(false);
  };

  const openExistingSubject = (mode: 'details' | 'edit', subjectId: string) => {
    setDialogMode(mode);
    setDialogSubjectId(subjectId);
    setDialogSubject(null);
    setDialogError('');
    setFormError('');
    setTopicFormError('');
    setTopicDrafts([]);
    setIsAddingTopics(false);
  };

  const closeDialog = () => {
    if (isSaving || isSavingTopics) return;
    setDialogMode(null);
    setDialogSubjectId(null);
    setDialogSubject(null);
    setDialogError('');
    setFormError('');
  };

  const validateForm = (): boolean => {
    const code = subjectCode.trim();
    const name = subjectName.trim();
    if (!code || code.length > 100) {
      setFormError(t('Mã môn học là bắt buộc và tối đa 100 ký tự.'));
      return false;
    }
    if (!name || name.length > 255) {
      setFormError(t('Tên môn học là bắt buộc và tối đa 255 ký tự.'));
      return false;
    }
    if (description.length > 2000) {
      setFormError(t('Mô tả môn học tối đa 2000 ký tự.'));
      return false;
    }
    return true;
  };

  const addTopicDraft = () => {
    topicDraftSequence.current += 1;
    setTopicDrafts((current) => [...current, emptyTopicDraft(topicDraftSequence.current)]);
    setTopicFormError('');
  };

  const updateTopicDraft = (id: number, field: keyof Omit<TopicDraft, 'id'>, value: string) => {
    setTopicDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, [field]: value } : draft));
    setTopicFormError('');
  };

  const removeTopicDraft = (id: number) => {
    setTopicDrafts((current) => current.filter((draft) => draft.id !== id));
    setTopicFormError('');
  };

  const validateTopicDrafts = (): AdminTopicRequest[] | null => {
    const topics: AdminTopicRequest[] = [];
    for (const [index, draft] of topicDrafts.entries()) {
      const topicCode = draft.topicCode.trim();
      const topicName = draft.topicName.trim();
      const description = draft.description.trim();
      if (!topicCode || topicCode.length > 255 || !topicName || topicName.length > 255) {
        setTopicFormError(`${t('Chủ đề')} ${index + 1}: ${t('Mã và tên chủ đề là bắt buộc, tối đa 255 ký tự.')}`);
        return null;
      }
      if (description.length > 2000) {
        setTopicFormError(`${t('Chủ đề')} ${index + 1}: ${t('Mô tả chủ đề tối đa 2000 ký tự.')}`);
        return null;
      }
      topics.push({ topicCode, topicName, description });
    }
    return topics;
  };

  const updateListWithSavedSubject = (savedSubject: AdminSubject, mode: Exclude<SubjectDialogMode, 'details' | null>) => {
    setSubjects((current) => {
      const rows = current ?? [];
      const matches = matchesKeyword(savedSubject, debouncedKeyword);
      if (mode === 'create') return matches ? [savedSubject, ...rows] : rows;
      if (!matches) return rows.filter((subject) => subject.subjectId !== savedSubject.subjectId);
      if (rows.some((subject) => subject.subjectId === savedSubject.subjectId)) {
        return rows.map((subject) => subject.subjectId === savedSubject.subjectId ? savedSubject : subject);
      }
      return [savedSubject, ...rows];
    });
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if ((dialogMode !== 'create' && dialogMode !== 'edit') || isSaving || !validateForm()) return;

    const topics = dialogMode === 'create' ? validateTopicDrafts() : [];
    if (dialogMode === 'create' && topics === null) return;

    const payload: AdminSubjectRequest = {
      subjectCode: subjectCode.trim(),
      subjectName: subjectName.trim(),
      description: description.trim() || null,
    };

    setIsSaving(true);
    setFormError('');
    try {
      const savedSubject = dialogMode === 'create'
        ? await createAdminSubject({ ...payload, topics: topics as AdminTopicRequest[] })
        : await updateAdminSubject(dialogSubjectId as string, payload);
      updateListWithSavedSubject(savedSubject, dialogMode);
      setDialogSubject(savedSubject);
      setSuccessMessage(t(dialogMode === 'create' ? 'Môn học đã được tạo.' : 'Thông tin môn học đã được cập nhật.'));
      setDialogMode(null);
      setDialogSubjectId(null);
      setDialogError('');
    } catch (error) {
      setFormError(getAdminErrorMessage(error, t));
      if (isAdminUnauthorized(error)) void requestLogout();
    } finally {
      setIsSaving(false);
    }
  };

  const submitAdditionalTopics = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dialogSubject || isSavingTopics) return;
    const topics = validateTopicDrafts();
    if (topics === null) return;
    if (!topics.length) {
      setTopicFormError(t('Thêm ít nhất một chủ đề và nhập mã cùng tên cho từng chủ đề.'));
      return;
    }

    setIsSavingTopics(true);
    setTopicFormError('');
    try {
      const savedSubject = await addAdminSubjectTopics(dialogSubject.subjectId, topics);
      setDialogSubject(savedSubject);
      updateListWithSavedSubject(savedSubject, 'edit');
      setTopicDrafts([]);
      setIsAddingTopics(false);
      setSuccessMessage(t('Chủ đề đã được thêm.'));
    } catch (error: unknown) {
      setTopicFormError(getAdminErrorMessage(error, t));
      if (isAdminUnauthorized(error)) void requestLogout();
    } finally {
      setIsSavingTopics(false);
    }
  };

  const closeOnBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) closeDialog();
  };

  const hasFilter = Boolean(keyword.trim());

  return (
    <main className="admin-feature-page admin-subjects-page">
      <header className="admin-feature-header admin-subjects-header">
        <div>
          <span className="admin-feature-eyebrow">{t('DANH MỤC HỌC THUẬT')}</span>
          <h1>{t('Môn học')}</h1>
          <p>{t('Quản lý danh mục môn học và thông tin học thuật.')}</p>
        </div>
        <div className="admin-subjects-header-actions">
          <Link className="admin-outline-button" to={APP_ROUTES.admin.subjectAssignments}>{t('Phân công giảng viên')}</Link>
          <button type="button" className="admin-primary-button" onClick={openCreate}><span aria-hidden="true">+</span>{t('Thêm môn học')}</button>
        </div>
      </header>

      {successMessage && <div className="admin-feedback success" role="status">{successMessage}</div>}

      <section className="admin-subject-search" aria-label={t('Tìm kiếm môn học')}>
        <label htmlFor="admin-subject-keyword">{t('Tìm kiếm')}</label>
        <input
          id="admin-subject-keyword"
          type="search"
          value={keyword}
          placeholder={t('Tìm theo mã môn, tên hoặc mô tả')}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <span className="admin-subject-search-status" aria-live="polite">
          {isLoading && subjects !== null ? t('Đang cập nhật danh sách…') : ''}
        </span>
        <button type="button" className="admin-outline-button" onClick={() => setRetryKey((value) => value + 1)} disabled={isLoading}>{t('Làm mới')}</button>
      </section>

      {listError && subjects !== null && (
        <div className="admin-feedback error admin-subject-list-error" role="alert">
          <span>{listError}</span>
          <button type="button" className="admin-outline-button" onClick={() => setRetryKey((value) => value + 1)} disabled={isLoading}>{t('Thử lại')}</button>
        </div>
      )}

      <section className="admin-subject-table-panel" aria-label={t('Danh sách môn học')}>
        {isLoading && subjects === null ? (
          <div className="admin-state-panel" role="status"><span className="admin-spinner" /><strong>{t('Đang tải danh sách môn học…')}</strong></div>
        ) : subjects === null && listError ? (
          <div className="admin-state-panel error" role="alert">
            <strong>{t('Không thể tải danh sách môn học.')}</strong>
            <p>{listError}</p>
            <button type="button" className="admin-primary-button" onClick={() => setRetryKey((value) => value + 1)} disabled={isLoading}>{t('Thử lại')}</button>
          </div>
        ) : subjects?.length === 0 ? (
          <div className="admin-subject-empty-state">
            <strong>{t(hasFilter ? 'Không tìm thấy môn học phù hợp.' : 'Chưa có môn học nào.')}</strong>
            <p>{t(hasFilter ? 'Thử đổi từ khóa tìm kiếm.' : 'Tạo môn học đầu tiên để bắt đầu quản lý danh mục.')}</p>
            {!hasFilter && <button type="button" className="admin-primary-button" onClick={openCreate}>{t('Thêm môn học')}</button>}
          </div>
        ) : subjects && subjects.length > 0 ? (
          <div className="admin-subject-table-scroll">
            <table className="admin-subject-table">
              <thead><tr>
                <th>{t('Mã môn')}</th>
                <th>{t('Tên môn')}</th>
                <th>{t('Mô tả')}</th>
                <th>{t('Chủ đề')}</th>
                <th>{t('Giảng viên được phân công')}</th>
                <th>{t('Thao tác')}</th>
              </tr></thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.subjectId}>
                    <td><span className="admin-subject-code">{subject.subjectCode}</span></td>
                    <td><button type="button" className="admin-subject-name" onClick={() => openExistingSubject('details', subject.subjectId)}>{subject.subjectName}</button></td>
                    <td className="admin-subject-description">{subject.description?.trim() || <span>{t('Chưa có mô tả.')}</span>}</td>
                    <td><span className="admin-subject-topic-count">{subject.topicCount}</span></td>
                    <td>
                      {subject.lecturers.length ? (
                        <div className="admin-subject-lecturers" title={subject.lecturers.map((lecturer) => lecturer.fullName).join(', ')}>
                          {subject.lecturers.map((lecturer) => lecturer.fullName).join(', ')}
                        </div>
                      ) : <span className="admin-subject-unassigned">{t('Chưa phân công')}</span>}
                    </td>
                    <td>
                      <div className="admin-subject-row-actions">
                        <button type="button" className="admin-subject-detail-button" onClick={() => openExistingSubject('details', subject.subjectId)}>{t('Chi tiết')}</button>
                        <button type="button" className="admin-subject-edit-button" onClick={() => openExistingSubject('edit', subject.subjectId)} aria-label={t('Sửa')} title={t('Sửa')}>
                          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14.5 5.5 4 4M4 20l4.1-.8L19.2 8.1a2.1 2.1 0 0 0-3-3L5.1 16.2 4 20Z" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {dialogMode === 'details' && (
        <div className="admin-subject-modal-backdrop" role="presentation" onMouseDown={closeOnBackdrop}>
          <section className="admin-subject-modal" role="dialog" aria-modal="true" aria-labelledby="admin-subject-details-title">
            <header className="admin-subject-modal-header">
              <div><span className="admin-feature-eyebrow">{t('CHI TIẾT MÔN HỌC')}</span><h2 id="admin-subject-details-title">{dialogSubject?.subjectName || t('Chi tiết môn học')}</h2></div>
              <button type="button" className="admin-subject-modal-close" onClick={closeDialog} disabled={isSavingTopics} aria-label={t('Đóng')}>×</button>
            </header>
            {dialogLoading ? (
              <div className="admin-state-panel" role="status"><span className="admin-spinner" /><strong>{t('Đang tải chi tiết môn học…')}</strong></div>
            ) : dialogError ? (
              <div className="admin-subject-modal-body">
                <div className="admin-feedback error" role="alert">{dialogError}</div>
                <div className="admin-subject-modal-actions"><button type="button" className="admin-outline-button" onClick={() => setDialogRetryKey((value) => value + 1)}>{t('Thử lại')}</button></div>
              </div>
            ) : dialogSubject ? (
              <div className="admin-subject-modal-body">
                <dl className="admin-subject-detail-grid">
                  <div><dt>{t('Mã môn')}</dt><dd>{dialogSubject.subjectCode}</dd></div>
                  <div><dt>{t('Tên môn')}</dt><dd>{dialogSubject.subjectName}</dd></div>
                  <div className="wide"><dt>{t('Mô tả')}</dt><dd>{dialogSubject.description?.trim() || t('Chưa có mô tả.')}</dd></div>
                  <div><dt>{t('Số chủ đề')}</dt><dd>{dialogSubject.topicCount}</dd></div>
                  <div><dt>{t('Số giảng viên')}</dt><dd>{dialogSubject.lecturers.length}</dd></div>
                </dl>
                <section className="admin-subject-detail-topics" aria-labelledby="admin-subject-topics-title">
                  <div className="admin-subject-detail-section-heading">
                    <div><h3 id="admin-subject-topics-title">{t('Chủ đề')}</h3><p>{t('Các nội dung thuộc môn học này.')}</p></div>
                    {!isAddingTopics && <button type="button" className="admin-outline-button" onClick={() => {
                      setTopicFormError('');
                      setIsAddingTopics(true);
                      if (!topicDrafts.length) addTopicDraft();
                    }}><span aria-hidden="true">+</span>{t('Thêm chủ đề')}</button>}
                  </div>
                  {dialogSubject.topics?.length ? (
                    <ul className="admin-subject-topic-list">
                      {dialogSubject.topics.map((topic) => (
                        <li key={topic.topicId}>
                          <span className="admin-subject-code">{topic.topicCode}</span>
                          <div><strong>{topic.topicName}</strong><p>{topic.description?.trim() || t('Chưa có mô tả.')}</p></div>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="admin-subject-topic-empty">{t('Môn học chưa có chủ đề.')}</p>}
                  {isAddingTopics && <form className="admin-topic-batch-form" onSubmit={(event) => void submitAdditionalTopics(event)} noValidate>
                    {topicDrafts.map((draft, index) => <TopicDraftFields
                      key={draft.id}
                      draft={draft}
                      index={index}
                      idPrefix="admin-detail-topic"
                      disabled={isSavingTopics}
                      onChange={updateTopicDraft}
                      onRemove={removeTopicDraft}
                    />)}
                    <button type="button" className="admin-outline-button admin-topic-add-row" onClick={addTopicDraft} disabled={isSavingTopics}><span aria-hidden="true">+</span>{t('Thêm dòng chủ đề')}</button>
                    {topicFormError && <div className="admin-feedback error" role="alert">{topicFormError}</div>}
                    <footer className="admin-subject-modal-actions">
                      <button type="button" className="admin-outline-button" onClick={() => { setIsAddingTopics(false); setTopicDrafts([]); setTopicFormError(''); }} disabled={isSavingTopics}>{t('Hủy')}</button>
                      <button type="submit" className="admin-primary-button" disabled={isSavingTopics || topicDrafts.length === 0}>{isSavingTopics ? t('Đang lưu…') : t('Lưu chủ đề')}</button>
                    </footer>
                  </form>}
                </section>
                <section className="admin-subject-detail-lecturers" aria-labelledby="admin-subject-lecturers-title">
                  <div className="admin-subject-detail-section-heading"><h3 id="admin-subject-lecturers-title">{t('Giảng viên được phân công')}</h3><Link to={APP_ROUTES.admin.subjectAssignments} onClick={closeDialog}>{t('Quản lý phân công')}</Link></div>
                  {dialogSubject.lecturers.length ? <ul>{dialogSubject.lecturers.map((lecturer) => <li key={lecturer.userId}><span><strong>{lecturer.fullName}</strong><small>{lecturer.email}{lecturer.studentOrStaffCode ? ` · ${lecturer.studentOrStaffCode}` : ''}</small></span><em className={lecturer.isActive ? 'active' : 'inactive'}>{t(lecturer.isActive ? 'Hoạt động' : 'Đã khóa')}</em></li>)}</ul> : <p className="admin-subject-unassigned">{t('Chưa có giảng viên được phân công.')}</p>}
                </section>
                <footer className="admin-subject-modal-actions">
                  <button type="button" className="admin-outline-button" onClick={closeDialog}>{t('Đóng')}</button>
                  <button type="button" className="admin-primary-button" onClick={() => openExistingSubject('edit', dialogSubject.subjectId)} disabled={isSavingTopics}>{t('Sửa môn học')}</button>
                </footer>
              </div>
            ) : null}
          </section>
        </div>
      )}

      {(dialogMode === 'create' || dialogMode === 'edit') && (
        <div className="admin-subject-modal-backdrop" role="presentation" onMouseDown={closeOnBackdrop}>
          <section className="admin-subject-modal" role="dialog" aria-modal="true" aria-labelledby="admin-subject-form-title">
            <header className="admin-subject-modal-header">
              <div><span className="admin-feature-eyebrow">{t(dialogMode === 'create' ? 'DANH MỤC HỌC THUẬT' : 'CHỈNH SỬA')}</span><h2 id="admin-subject-form-title">{t(dialogMode === 'create' ? 'Thêm môn học' : 'Sửa môn học')}</h2></div>
              <button type="button" className="admin-subject-modal-close" onClick={closeDialog} disabled={isSaving} aria-label={t('Đóng')}>×</button>
            </header>
            <form className="admin-subject-form" onSubmit={(event) => void submitForm(event)} noValidate>
              {dialogMode === 'edit' && dialogLoading ? (
                <div className="admin-state-panel" role="status"><span className="admin-spinner" /><strong>{t('Đang tải chi tiết môn học…')}</strong></div>
              ) : dialogMode === 'edit' && dialogError ? (
                <div className="admin-feedback error" role="alert">{dialogError}<button type="button" className="admin-outline-button" onClick={() => setDialogRetryKey((value) => value + 1)}>{t('Thử lại')}</button></div>
              ) : (
                <>
                  {dialogError && <div className="admin-feedback error" role="alert">{dialogError}</div>}
                  <div className="admin-subject-form-field">
                    <label htmlFor="admin-subject-code">{t('Mã môn')}</label>
                    <input id="admin-subject-code" value={subjectCode} maxLength={100} onChange={(event) => setSubjectCode(event.target.value)} autoComplete="off" disabled={isSaving} required />
                    <small>{t('Tối đa 100 ký tự.')}</small>
                  </div>
                  <div className="admin-subject-form-field">
                    <label htmlFor="admin-subject-name">{t('Tên môn')}</label>
                    <input id="admin-subject-name" value={subjectName} maxLength={255} onChange={(event) => setSubjectName(event.target.value)} disabled={isSaving} required />
                    <small>{t('Tối đa 255 ký tự.')}</small>
                  </div>
                  <div className="admin-subject-form-field">
                    <label htmlFor="admin-subject-description">{t('Mô tả')}</label>
                    <textarea id="admin-subject-description" value={description} maxLength={2000} rows={4} onChange={(event) => setDescription(event.target.value)} disabled={isSaving} />
                    <small>{description.length} / 2000</small>
                  </div>
                  {dialogMode === 'create' && <section className="admin-subject-topics-form" aria-labelledby="admin-create-topics-title">
                    <div className="admin-subject-detail-section-heading">
                      <div><h3 id="admin-create-topics-title">{t('Chủ đề')}</h3><p>{t('Có thể tạo môn học chưa có chủ đề.')}</p></div>
                      <button type="button" className="admin-outline-button" onClick={addTopicDraft} disabled={isSaving}><span aria-hidden="true">+</span>{t('Thêm chủ đề')}</button>
                    </div>
                    {topicDrafts.map((draft, index) => <TopicDraftFields
                      key={draft.id}
                      draft={draft}
                      index={index}
                      idPrefix="admin-create-topic"
                      disabled={isSaving}
                      onChange={updateTopicDraft}
                      onRemove={removeTopicDraft}
                    />)}
                    {topicFormError && <div className="admin-feedback error" role="alert">{topicFormError}</div>}
                  </section>}
                  {formError && <div className="admin-feedback error" role="alert">{formError}</div>}
                  <footer className="admin-subject-modal-actions">
                    <button type="button" className="admin-outline-button" onClick={closeDialog} disabled={isSaving}>{t('Hủy')}</button>
                    <button type="submit" className="admin-primary-button" disabled={isSaving}>
                      {isSaving ? t('Đang lưu…') : t(dialogMode === 'create' ? 'Tạo môn học' : 'Lưu thay đổi')}
                    </button>
                  </footer>
                </>
              )}
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
