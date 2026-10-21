import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  assignLecturersToSubject,
  getAdminLecturers,
  getSubjectAssignments,
  unassignLecturerFromSubject,
} from '../../services/system/systemService';
import type { AdminLecturer, AdminSubjectAssignment } from '../../types/system';
import { getAdminErrorMessage, isAdminUnauthorized } from '../../utils/adminError';
import useAdminSession from './useAdminSession';
import './SystemAdministration.css';

type RemovalTarget = { subject: AdminSubjectAssignment; lecturer: AdminLecturer };

export default function SubjectAssignmentsPage() {
  const { t } = useLanguage();
  const handleUnauthorized = useAdminSession();
  const [lecturers, setLecturers] = useState<AdminLecturer[]>([]);
  const [subjects, setSubjects] = useState<AdminSubjectAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedBySubject, setSelectedBySubject] = useState<Record<string, string[]>>({});
  const [savingSubjectId, setSavingSubjectId] = useState<string | null>(null);
  const [removalTarget, setRemovalTarget] = useState<RemovalTarget | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const unauthorizedStarted = useRef(false);

  const requestLogout = useCallback(async () => {
    if (unauthorizedStarted.current) return;
    unauthorizedStarted.current = true;
    await handleUnauthorized();
  }, [handleUnauthorized]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMessage('');
    Promise.all([getAdminLecturers(), getSubjectAssignments()])
      .then(([lecturerRows, subjectRows]) => {
        if (!active) return;
        setLecturers(lecturerRows);
        setSubjects(subjectRows);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setErrorMessage(getAdminErrorMessage(error, t));
        if (isAdminUnauthorized(error)) void requestLogout();
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey, requestLogout, t]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timeout = window.setTimeout(() => setSuccessMessage(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  const updateSubject = (updated: AdminSubjectAssignment) => {
    setSubjects((current) => current.map((subject) => subject.subjectId === updated.subjectId ? updated : subject));
    setSelectedBySubject((current) => ({ ...current, [updated.subjectId]: [] }));
    setActionMessage('');
    setSuccessMessage(t('Đã cập nhật phân công.'));
  };

  const toggleLecturer = (subjectId: string, lecturerId: string) => {
    setSelectedBySubject((current) => {
      const selected = current[subjectId] ?? [];
      const next = selected.includes(lecturerId)
        ? selected.filter((id) => id !== lecturerId)
        : [...selected, lecturerId];
      return { ...current, [subjectId]: next };
    });
  };

  const assignSelected = async (subject: AdminSubjectAssignment) => {
    const lecturerIds = selectedBySubject[subject.subjectId] ?? [];
    if (!lecturerIds.length) return;
    setSavingSubjectId(subject.subjectId);
    setActionMessage('');
    try {
      const updated = await assignLecturersToSubject(subject.subjectId, lecturerIds);
      updateSubject(updated);
    } catch (error) {
      setActionMessage(getAdminErrorMessage(error, t));
      if (isAdminUnauthorized(error)) void requestLogout();
    } finally {
      setSavingSubjectId(null);
    }
  };

  const removeAssignment = async () => {
    if (!removalTarget) return;
    setSavingSubjectId(removalTarget.subject.subjectId);
    setActionMessage('');
    try {
      const updated = await unassignLecturerFromSubject(removalTarget.subject.subjectId, removalTarget.lecturer.userId);
      updateSubject(updated);
      setRemovalTarget(null);
    } catch (error) {
      setActionMessage(getAdminErrorMessage(error, t));
      if (isAdminUnauthorized(error)) void requestLogout();
    } finally {
      setSavingSubjectId(null);
    }
  };

  return (
    <main className="admin-feature-page">
      <header className="admin-feature-header">
        <div><span className="admin-feature-eyebrow">{t('PHÂN CÔNG')}</span><h1>{t('Phân công giảng viên')}</h1><p>{t('Quản lý phân công giảng viên cho các môn học.')}</p></div>
        {!loading && !errorMessage && <button type="button" className="admin-outline-button" onClick={() => setReloadKey((value) => value + 1)}>{t('Làm mới')}</button>}
      </header>

      {successMessage && <div className="admin-feedback success" role="status">{successMessage}</div>}
      {loading ? (
        <section className="admin-state-panel" role="status"><span className="admin-spinner" /><strong>{t('Đang tải danh sách phân công…')}</strong></section>
      ) : errorMessage ? (
        <section className="admin-state-panel error" role="alert"><strong>{t('Không thể tải dữ liệu phân công.')}</strong><p>{errorMessage}</p><button type="button" className="admin-primary-button" onClick={() => setReloadKey((value) => value + 1)}>{t('Thử lại')}</button></section>
      ) : !subjects.length ? (
        <section className="admin-state-panel"><strong>{t('Chưa có môn học.')}</strong></section>
      ) : (
        <div className="admin-assignment-list">
          {subjects.map((subject) => {
            const assignedIds = new Set(subject.lecturerIds);
            const available = lecturers.filter((lecturer) => !assignedIds.has(lecturer.userId));
            const selected = selectedBySubject[subject.subjectId] ?? [];
            const busy = savingSubjectId === subject.subjectId;
            return (
              <section className="admin-assignment-panel" key={subject.subjectId}>
                <header className="admin-assignment-heading">
                  <div><span className="admin-assignment-code">{subject.subjectCode}</span><h2>{subject.subjectName}</h2></div>
                  <span className="admin-assignment-count">{subject.lecturers.length} {t('giảng viên được gán')}</span>
                </header>
                {actionMessage && <div className="admin-feedback error" role="alert">{actionMessage}</div>}

                <div className="admin-assigned-list">
                  {subject.lecturers.length ? subject.lecturers.map((lecturer) => (
                    <article className="admin-assigned-row" key={lecturer.userId}>
                      <div className="admin-assigned-identity">
                        <span className="admin-avatar" aria-hidden="true">{lecturer.fullName.slice(0, 1).toUpperCase()}</span>
                        <span><strong>{lecturer.fullName}</strong><small>{lecturer.email}{lecturer.studentOrStaffCode ? ` · ${lecturer.studentOrStaffCode}` : ''}</small></span>
                      </div>
                      <div className="admin-assigned-actions">
                        <span className={`admin-person-status ${lecturer.isActive ? 'active' : 'inactive'}`}>{t(lecturer.isActive ? 'Giảng viên đang hoạt động' : 'Tài khoản đã khóa')}</span>
                        <button type="button" className="admin-danger-button" onClick={() => setRemovalTarget({ subject, lecturer })} disabled={busy}>{t('Hủy phân công')}</button>
                      </div>
                    </article>
                  )) : <p className="admin-empty-inline">{t('Chưa có giảng viên được phân công.')}</p>}
                </div>

                <div className="admin-assign-controls">
                  <fieldset disabled={busy || !available.length}>
                    <legend>{t('Chọn giảng viên để phân công')}</legend>
                    {!lecturers.length ? <p className="admin-empty-inline">{t('Chưa có giảng viên.')}</p> : !available.length ? <p className="admin-empty-inline">{t('Không còn giảng viên để phân công.')}</p> : (
                      <div className="admin-lecturer-options">
                        {available.map((lecturer) => (
                          <label className="admin-lecturer-option" key={lecturer.userId}>
                            <input type="checkbox" checked={selected.includes(lecturer.userId)} onChange={() => toggleLecturer(subject.subjectId, lecturer.userId)} />
                            <span><strong>{lecturer.fullName}</strong><small>{lecturer.email}</small></span>
                            <em className={lecturer.isActive ? 'active' : 'inactive'}>{t(lecturer.isActive ? 'Hoạt động' : 'Đã khóa')}</em>
                          </label>
                        ))}
                      </div>
                    )}
                  </fieldset>
                  <button type="button" className="admin-primary-button" onClick={() => void assignSelected(subject)} disabled={!selected.length || busy}>
                    {busy ? t('Đang phân công…') : t('Gán giảng viên')}
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {removalTarget && (
        <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingSubjectId) setRemovalTarget(null); }}>
          <section className="modal-container modal-container-sm" role="dialog" aria-modal="true" aria-labelledby="assignment-remove-title">
            <header className="modal-header"><h2 className="modal-title" id="assignment-remove-title">{t('Xác nhận hủy phân công')}</h2></header>
            <div className="admin-dialog-body">
              <p>{t('Bạn có chắc muốn hủy phân công giảng viên này khỏi môn học?')}</p>
              <strong>{removalTarget.lecturer.fullName}</strong><span>{removalTarget.subject.subjectCode} · {removalTarget.subject.subjectName}</span>
              {actionMessage && <div className="admin-feedback error" role="alert">{actionMessage}</div>}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setRemovalTarget(null)} disabled={Boolean(savingSubjectId)}>{t('Hủy')}</button>
                <button type="button" className="btn btn-danger" onClick={() => void removeAssignment()} disabled={Boolean(savingSubjectId)}>{savingSubjectId ? t('Đang lưu…') : t('Hủy phân công')}</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
