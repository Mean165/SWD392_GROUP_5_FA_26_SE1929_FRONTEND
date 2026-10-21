import { useEffect, useState, type FormEvent } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { getUserById, updateUser } from '../../services/userService';
import type { ManagedRoleCode, UserResponse } from '../../types/user';
import { getAdminErrorMessage, isAdminUnauthorized } from '../../utils/adminError';

interface EditUserModalProps {
  isOpen: boolean;
  userId: string | null;
  onClose: () => void;
  onSuccess: (message: string, updatedUser: UserResponse) => void;
  onUnauthorized?: () => void | Promise<void>;
}

export default function EditUserModal({ isOpen, userId, onClose, onSuccess, onUnauthorized }: EditUserModalProps) {
  const { t } = useLanguage();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [roleCode, setRoleCode] = useState<ManagedRoleCode>('LE');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen || !userId) return undefined;
    let active = true;
    setUser(null);
    setIsLoading(true);
    setErrorMessage('');
    getUserById(userId)
      .then((result) => {
        if (!active) return;
        setUser(result);
        const role = (result.role?.roleCode || result.roleName || '').toUpperCase();
        if (role === 'AD' || role === 'ADMIN') {
          setErrorMessage(t('Không thể chỉnh sửa tài khoản Admin trong mục này.'));
          return;
        }
        setRoleCode(role === 'LE' || role === 'LECTURER' ? 'LE' : 'ST');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setErrorMessage(getAdminErrorMessage(error, t));
        if (isAdminUnauthorized(error)) void onUnauthorized?.();
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [isOpen, onUnauthorized, t, userId]);

  if (!isOpen) return null;

  const close = () => {
    if (isSubmitting) return;
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId || !user) return;
    const role = (user.role?.roleCode || user.roleName || '').toUpperCase();
    if (role === 'AD' || role === 'ADMIN') {
      setErrorMessage(t('Không thể chỉnh sửa tài khoản Admin trong mục này.'));
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const updatedUser = await updateUser(userId, { roleCode });
      onSuccess(t('Thông tin tài khoản đã được cập nhật.'), updatedUser);
      onClose();
    } catch (error) {
      setErrorMessage(getAdminErrorMessage(error, t));
      if (isAdminUnauthorized(error)) void onUnauthorized?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section className="modal-container" role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
        <header className="modal-header">
          <h2 className="modal-title" id="edit-user-title">{t('Chỉnh sửa tài khoản')}</h2>
          <button type="button" className="modal-close-btn" onClick={close} disabled={isSubmitting} aria-label={t('Đóng')}>×</button>
        </header>
        {isLoading ? (
          <div className="state-container" role="status"><div className="loading-spinner" /><p>{t('Đang tải thông tin tài khoản…')}</p></div>
        ) : (
          <form className="modal-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
            {errorMessage && <div className="alert-message alert-error" role="alert">{errorMessage}</div>}
            {user && <>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-account-code">{t('Mã cán bộ/SV')}</label>
                <input id="edit-account-code" className="form-input input-readonly" value={user.studentOrStaffCode || '—'} readOnly disabled />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-full-name">{t('Họ và tên')}</label>
                <input id="edit-full-name" className="form-input input-readonly" value={user.fullName || ''} autoComplete="name" readOnly />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-email">Email</label>
                <input id="edit-email" className="form-input input-readonly" type="email" value={user.email || ''} autoComplete="email" readOnly />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-role">{t('Vai trò')}</label>
                <select id="edit-role" className="form-select" value={roleCode} onChange={(event) => setRoleCode(event.target.value as ManagedRoleCode)} disabled={isSubmitting}>
                  <option value="LE">{t('Giảng viên')}</option>
                  <option value="ST">{t('Sinh viên')}</option>
                </select>
              </div>
            </>}
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={close} disabled={isSubmitting}>{t('Hủy')}</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || !user}>{isSubmitting ? t('Đang lưu…') : t('Lưu thay đổi')}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
