import { useState, type FormEvent } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { createUser } from '../../services/userService';
import type { ManagedRoleCode } from '../../types/user';
import { getAdminErrorMessage, isAdminUnauthorized } from '../../utils/adminError';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onUnauthorized?: () => void | Promise<void>;
}

export default function CreateUserModal({ isOpen, onClose, onSuccess, onUnauthorized }: CreateUserModalProps) {
  const { t } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [roleCode, setRoleCode] = useState<ManagedRoleCode>('LE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const close = () => {
    if (isSubmitting) return;
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage(t('Nhập họ và tên'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage(t('Email không hợp lệ.'));
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await createUser({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        roleCode,
      });
      setFullName('');
      setEmail('');
      setRoleCode('LE');
      onSuccess(t('Tài khoản đã được tạo và thông tin đã được gửi qua email.'));
      onClose();
    } catch (error) {
      if (isAdminUnauthorized(error)) void onUnauthorized?.();
      setErrorMessage(getAdminErrorMessage(error, t));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section className="modal-container" role="dialog" aria-modal="true" aria-labelledby="create-user-title">
        <header className="modal-header">
          <h2 className="modal-title" id="create-user-title">{t('Tạo tài khoản')}</h2>
          <button type="button" className="modal-close-btn" onClick={close} disabled={isSubmitting} aria-label={t('Đóng')}>×</button>
        </header>
        <form className="modal-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
          {errorMessage && <div className="alert-message alert-error" role="alert">{errorMessage}</div>}
          <div className="form-group">
            <label className="form-label" htmlFor="create-full-name">{t('Họ và tên')}</label>
            <input id="create-full-name" className="form-input" type="text" value={fullName} autoComplete="name" onChange={(event) => setFullName(event.target.value)} disabled={isSubmitting} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="create-email">Email</label>
            <input id="create-email" className="form-input" type="email" value={email} autoComplete="email" onChange={(event) => setEmail(event.target.value)} disabled={isSubmitting} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="create-role">{t('Vai trò')}</label>
            <select id="create-role" className="form-select" value={roleCode} onChange={(event) => setRoleCode(event.target.value as ManagedRoleCode)} disabled={isSubmitting}>
              <option value="LE">{t('Giảng viên')}</option>
              <option value="ST">{t('Sinh viên')}</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={close} disabled={isSubmitting}>{t('Hủy')}</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? t('Đang lưu…') : t('Tạo tài khoản')}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
