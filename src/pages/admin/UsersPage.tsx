import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import {
  getAdminUsers,
  deleteStudentAccount,
  lockUser,
  unlockUser,
} from '../../services/userService';
import type { AdminUser, AdminUserQuery, ManagedRoleCode, PageResponse, UserResponse } from '../../types/user';
import CreateUserModal from '../../components/users/CreateUserModal';
import EditUserModal from '../../components/users/EditUserModal';
import { getAdminErrorMessage, isAdminUnauthorized } from '../../utils/adminError';
import useAdminSession from './useAdminSession';
import './UsersPage.css';

type Filters = {
  keyword: string;
  roleCode: '' | ManagedRoleCode;
  active: '' | 'true' | 'false';
};

const initialFilters: Filters = { keyword: '', roleCode: '', active: '' };
const PAGE_SIZE = 20;

function AccountActionIcon({ kind }: { kind: 'edit' | 'lock' | 'unlock' | 'delete' }) {
  if (kind === 'edit') {
    return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14.5 5.5 4 4M4 20l4.1-.8L19.2 8.1a2.1 2.1 0 0 0-3-3L5.1 16.2 4 20Z" /></svg>;
  }
  if (kind === 'delete') {
    return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>;
  }
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="10" width="16" height="11" rx="2" />
    {kind === 'unlock' ? <path d="M8 10V7a4 4 0 0 1 7.5-2" /> : <path d="M8 10V7a4 4 0 0 1 8 0v3" />}
    <path d="M12 14v3" />
  </svg>;
}

export default function UsersPage() {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const handleUnauthorized = useAdminSession();
  const [draftFilters, setDraftFilters] = useState<Filters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(initialFilters);
  const [page, setPage] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<PageResponse<AdminUser> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [actionError, setActionError] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const unauthorizedStarted = useRef(false);

  const requestLogout = useCallback(async () => {
    if (unauthorizedStarted.current) return;
    unauthorizedStarted.current = true;
    await handleUnauthorized();
  }, [handleUnauthorized]);

  useEffect(() => {
    let active = true;
    const query: AdminUserQuery = {
      page,
      size: PAGE_SIZE,
      ...(appliedFilters.keyword.trim() ? { keyword: appliedFilters.keyword.trim() } : {}),
      ...(appliedFilters.roleCode ? { roleCode: appliedFilters.roleCode } : {}),
      ...(appliedFilters.active ? { isActive: appliedFilters.active === 'true' } : {}),
    };

    setIsLoading(true);
    setErrorMessage('');
    getAdminUsers(query)
      .then((result) => {
        if (!active) return;
        setData(result);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setData(null);
        setErrorMessage(getAdminErrorMessage(error, t));
        if (isAdminUnauthorized(error)) void requestLogout();
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [appliedFilters, page, reloadKey, requestLogout, t]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timeout = window.setTimeout(() => setSuccessMessage(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(0);
    setAppliedFilters({ ...draftFilters, keyword: draftFilters.keyword.trim() });
  };

  const resetFilters = () => {
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(0);
  };

  const reportActionError = (error: unknown) => {
    setActionError(getAdminErrorMessage(error, t));
    if (isAdminUnauthorized(error)) void requestLogout();
  };

  const refreshAfterMutation = (message: string) => {
    setSuccessMessage(message);
    setActionError('');
    setReloadKey((key) => key + 1);
  };

  const applyAccountUpdate = (updatedUser: UserResponse) => {
    const returnedRole = (updatedUser.role?.roleCode || '').toUpperCase();
    const roleCode: ManagedRoleCode | undefined = returnedRole === 'LE' || returnedRole === 'LECTURER'
      ? 'LE'
      : returnedRole === 'ST' || returnedRole === 'STUDENT'
        ? 'ST'
        : undefined;

    setData((current) => current ? {
      ...current,
      content: current.content.map((account) => account.userId === updatedUser.userId ? {
        ...account,
        fullName: updatedUser.fullName || account.fullName,
        email: updatedUser.email || account.email,
        studentOrStaffCode: updatedUser.studentOrStaffCode ?? account.studentOrStaffCode,
        isActive: updatedUser.isActive ?? account.isActive,
        createdAt: updatedUser.createdAt ?? account.createdAt,
        roleName: updatedUser.roleName || updatedUser.role?.roleName || account.roleName,
        role: roleCode ? {
          ...account.role,
          roleCode,
          roleName: updatedUser.role?.roleName || updatedUser.roleName || account.role.roleName,
          description: updatedUser.role?.description ?? account.role.description,
          createdAt: updatedUser.role?.createdAt ?? account.role.createdAt,
        } : account.role,
      } : account),
    } : current);
  };

  const handleEditSuccess = (message: string, updatedUser: UserResponse) => {
    applyAccountUpdate(updatedUser);
    setSuccessMessage(message);
    setActionError('');
  };

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    const currentId = String(currentUser?.userId ?? currentUser?.id ?? '');
    if (statusTarget.isActive && statusTarget.userId === currentId) {
      setActionError(t('Không thể khóa tài khoản hiện tại.'));
      setStatusTarget(null);
      return;
    }

    setIsActionLoading(true);
    setActionError('');
    try {
      if (statusTarget.isActive) {
        const updatedUser = await lockUser(statusTarget.userId);
        applyAccountUpdate(updatedUser);
        setSuccessMessage(t('Tài khoản đã bị khóa.'));
      } else {
        const updatedUser = await unlockUser(statusTarget.userId);
        applyAccountUpdate(updatedUser);
        setSuccessMessage(t('Tài khoản đã được mở khóa.'));
      }
      setActionError('');
      setStatusTarget(null);
    } catch (error) {
      reportActionError(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const confirmStudentDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.role.roleCode !== 'ST' || deleteTarget.isActive) {
      setActionError(t('Chỉ có thể xóa tài khoản Sinh viên đã khóa.'));
      return;
    }
    setIsActionLoading(true);
    setActionError('');
    try {
      await deleteStudentAccount(deleteTarget.userId);
      setDeleteTarget(null);
      refreshAfterMutation(t('Tài khoản Sinh viên đã được xóa.'));
    } catch (error) {
      reportActionError(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const currentUserId = String(currentUser?.userId ?? currentUser?.id ?? '');
  const totalPages = Math.max(data?.totalPages ?? 0, 1);
  const hasFilters = Boolean(appliedFilters.keyword || appliedFilters.roleCode || appliedFilters.active);

  return (
    <div className="users-page-container">
      <header className="users-page-header">
        <div className="users-page-title-group">
          <h1>{t('Quản lý tài khoản')}</h1>
          <p className="users-page-subtitle">{t('Quản lý tài khoản Sinh viên và Giảng viên.')}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <span aria-hidden="true">+</span> {t('Tạo tài khoản')}
        </button>
      </header>

      {successMessage && <div className="alert-toast alert-success" role="status">{successMessage}</div>}

      <section className="user-filter-card" aria-label={t('Bộ lọc tài khoản')}>
        <form className="user-filter-form" onSubmit={applyFilters}>
          <div className="filter-field">
            <label className="filter-label" htmlFor="admin-user-keyword">{t('Tìm kiếm')}</label>
            <input
              id="admin-user-keyword"
              className="filter-input"
              type="search"
              placeholder={t('Tìm theo tên hoặc email')}
              value={draftFilters.keyword}
              onChange={(event) => setDraftFilters((filters) => ({ ...filters, keyword: event.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="filter-field">
            <label className="filter-label" htmlFor="admin-user-role">{t('Vai trò')}</label>
            <select
              id="admin-user-role"
              className="filter-select"
              value={draftFilters.roleCode}
              onChange={(event) => setDraftFilters((filters) => ({ ...filters, roleCode: event.target.value as Filters['roleCode'] }))}
              disabled={isLoading}
            >
              <option value="">{t('Tất cả vai trò')}</option>
              <option value="LE">{t('Giảng viên')}</option>
              <option value="ST">{t('Sinh viên')}</option>
            </select>
          </div>
          <div className="filter-field">
            <label className="filter-label" htmlFor="admin-user-status">{t('Trạng thái')}</label>
            <select
              id="admin-user-status"
              className="filter-select"
              value={draftFilters.active}
              onChange={(event) => setDraftFilters((filters) => ({ ...filters, active: event.target.value as Filters['active'] }))}
              disabled={isLoading}
            >
              <option value="">{t('Tất cả trạng thái')}</option>
              <option value="true">{t('Hoạt động')}</option>
              <option value="false">{t('Đã khóa')}</option>
            </select>
          </div>
          <div className="filter-actions">
            <button type="submit" className="btn btn-primary" disabled={isLoading}>{t('Tìm kiếm')}</button>
            <button type="button" className="btn btn-secondary" onClick={resetFilters} disabled={isLoading}>{t('Xóa lọc')}</button>
          </div>
        </form>
      </section>

      {actionError && <div className="alert-toast alert-error" role="alert">{actionError}</div>}

      <section className="card-panel table-panel" aria-label={t('Danh sách tài khoản')}>
        {isLoading ? (
          <div className="state-container" role="status">
            <div className="loading-spinner" />
            <p className="state-title">{t('Đang tải danh sách tài khoản…')}</p>
          </div>
        ) : errorMessage ? (
          <div className="state-container" role="alert">
            <p className="state-title text-danger">{t('Không thể tải danh sách tài khoản.')}</p>
            <p className="state-desc">{errorMessage}</p>
            <button type="button" className="btn btn-secondary" onClick={() => setReloadKey((key) => key + 1)}>{t('Thử lại')}</button>
          </div>
        ) : !data?.content.length ? (
          <div className="state-container">
            <p className="state-title">{t('Không tìm thấy tài khoản.')}</p>
            <p className="state-desc">{t(hasFilters ? 'Không có tài khoản nào khớp với bộ lọc.' : 'Chưa có tài khoản nào.')}</p>
          </div>
        ) : (
          <>
            <div className="user-table-wrapper">
              <table className="user-table">
                <colgroup>
                  <col className="user-column-code" />
                  <col className="user-column-name" />
                  <col className="user-column-email" />
                  <col className="user-column-role" />
                  <col className="user-column-status" />
                  <col className="user-column-actions" />
                </colgroup>
                <thead><tr>
                  <th>{t('Mã cán bộ/SV')}</th>
                  <th>{t('Họ và tên')}</th>
                  <th>Email</th>
                  <th>{t('Vai trò')}</th>
                  <th>{t('Trạng thái')}</th>
                  <th>{t('Thao tác')}</th>
                </tr></thead>
                <tbody>
                  {data.content.map((account) => {
                    const roleCode = account.role.roleCode;
                    const isSelf = account.userId === currentUserId;
                    return (
                      <tr key={account.userId} className="user-table-row">
                        <td>{account.studentOrStaffCode || '—'}</td>
                        <td className="font-medium">{account.fullName}</td>
                        <td>{account.email}</td>
                        <td><span className={`role-badge ${roleCode === 'LE' ? 'badge-lecturer' : 'badge-student'}`}>{t(roleCode === 'LE' ? 'Giảng viên' : 'Sinh viên')}</span></td>
                        <td><span className={`status-badge ${account.isActive ? 'status-active' : 'status-inactive'}`}>
                          <span className="status-dot" />{t(account.isActive ? 'Hoạt động' : 'Đã khóa')}
                        </span></td>
                        <td>
                          <div className="admin-user-actions">
                            <button type="button" className="btn-action btn-action-edit" onClick={() => setEditingUserId(account.userId)} disabled={isActionLoading} aria-label={t('Sửa')} title={t('Sửa')}>
                              <AccountActionIcon kind="edit" />
                            </button>
                            <button
                              type="button"
                              className={`btn-action ${account.isActive ? 'btn-action-lock' : 'btn-action-unlock'}`}
                              onClick={() => { setActionError(''); setStatusTarget(account); }}
                              disabled={isActionLoading || (isSelf && account.isActive)}
                              aria-label={t(account.isActive ? 'Khóa' : 'Mở khóa')}
                              title={isSelf && account.isActive ? t('Không thể khóa tài khoản hiện tại.') : t(account.isActive ? 'Khóa' : 'Mở khóa')}
                            >
                              <AccountActionIcon kind={account.isActive ? 'lock' : 'unlock'} />
                            </button>
                            {roleCode === 'ST' && !account.isActive && <button type="button" className="btn-action btn-action-delete" onClick={() => { setActionError(''); setDeleteTarget(account); }} disabled={isActionLoading} aria-label={t('Xóa')} title={t('Xóa')}>
                              <AccountActionIcon kind="delete" />
                            </button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <footer className="admin-user-pagination">
              <span>{t('Tổng số')}: {data.totalElements}</span>
              <div>
                <button type="button" className="btn btn-secondary" disabled={page === 0 || isLoading} onClick={() => setPage((value) => Math.max(0, value - 1))}>{t('Trước')}</button>
                <span>{t('Trang')} {page + 1} / {totalPages}</span>
                <button type="button" className="btn btn-secondary" disabled={page + 1 >= totalPages || isLoading} onClick={() => setPage((value) => value + 1)}>{t('Sau')}</button>
              </div>
            </footer>
          </>
        )}
      </section>

      <CreateUserModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(message) => refreshAfterMutation(message)}
        onUnauthorized={requestLogout}
      />
      <EditUserModal
        isOpen={Boolean(editingUserId)}
        userId={editingUserId}
        onClose={() => setEditingUserId(null)}
        onSuccess={handleEditSuccess}
        onUnauthorized={requestLogout}
      />

      {statusTarget && (
        <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isActionLoading) setStatusTarget(null); }}>
          <section className="modal-container modal-container-sm admin-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="status-confirm-title">
            <header className="modal-header"><h2 className="modal-title" id="status-confirm-title">{t(statusTarget.isActive ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa tài khoản')}</h2></header>
            <div className="admin-dialog-body">
              <p>{t(statusTarget.isActive ? 'Bạn có chắc muốn khóa tài khoản này?' : 'Bạn có chắc muốn mở khóa tài khoản này?')}</p>
              <strong>{statusTarget.fullName}</strong><span>{statusTarget.email}</span>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setStatusTarget(null)} disabled={isActionLoading}>{t('Hủy')}</button>
                <button type="button" className={`btn ${statusTarget.isActive ? 'btn-danger' : 'btn-primary'}`} onClick={() => void confirmStatusChange()} disabled={isActionLoading}>
                  {isActionLoading ? t('Đang lưu…') : t(statusTarget.isActive ? 'Khóa' : 'Mở khóa')}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isActionLoading) setDeleteTarget(null); }}>
          <section className="modal-container modal-container-sm" role="dialog" aria-modal="true" aria-labelledby="delete-student-title">
            <header className="modal-header"><h2 className="modal-title" id="delete-student-title">{t('Xác nhận xóa tài khoản')}</h2></header>
            <div className="admin-dialog-body">
              <p>{t('Bạn có chắc muốn xóa tài khoản Sinh viên đã khóa này?')}</p>
              <strong>{deleteTarget.fullName}</strong><span>{deleteTarget.email}</span>
              {actionError && <p className="field-error-text" role="alert">{actionError}</p>}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={isActionLoading}>{t('Hủy')}</button>
                <button type="button" className="btn btn-danger" onClick={() => void confirmStudentDelete()} disabled={isActionLoading}>{isActionLoading ? t('Đang lưu…') : t('Xóa tài khoản')}</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
