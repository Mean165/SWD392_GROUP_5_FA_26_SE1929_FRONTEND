import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import './ChangePasswordPage.css';

const homeForRole = (role: string) => {
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'LECTURER') return '/lecturer/dashboard';
  return '/student/dashboard';
};

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, changePassword } = useAuth();
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.mustChangePassword) return <Navigate to={homeForRole(user?.role || 'STUDENT')} replace />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 8 || newPassword.length > 128) {
      setErrorMessage(t('Mật khẩu phải có từ 8 đến 128 ký tự.'));
      return;
    }
    if (newPassword !== confirmation) {
      setErrorMessage(t('Mật khẩu xác nhận không khớp.'));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const updatedUser = await changePassword(newPassword);
      navigate(homeForRole(updatedUser.role), { replace: true });
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || t('Không thể đổi mật khẩu. Vui lòng thử lại.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="change-password-page">
      <section className="change-password-card" aria-labelledby="change-password-title">
        <h1 id="change-password-title">{t('Đổi mật khẩu')}</h1>
        <p>{t('Hãy đặt mật khẩu mới để tiếp tục sử dụng tài khoản.')}</p>
        {errorMessage && <div className="change-password-error" role="alert">{errorMessage}</div>}
        <form className="change-password-form" onSubmit={(event) => void handleSubmit(event)}>
          <label htmlFor="new-password">{t('Mật khẩu mới')}</label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            disabled={isSubmitting}
            required
          />
          <label htmlFor="confirm-password">{t('Xác nhận mật khẩu mới')}</label>
          <input
            id="confirm-password"
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            disabled={isSubmitting}
            required
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('Đang lưu…') : t('Lưu mật khẩu mới')}
          </button>
        </form>
      </section>
    </main>
  );
}
