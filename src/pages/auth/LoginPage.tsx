import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSelector from '../../components/common/LanguageSelector';
import './LoginPage.css';

/**
 * Hàm phân tích và trích xuất thông báo lỗi thân thiện cho người dùng
 */
function extractErrorMessage(error: any): string {
  // 1. Kiểm tra nếu backend trả về HTTP 500 (Internal Server Error)
  if (error?.response?.status === 500) {
    return 'Hệ thống máy chủ đang gặp sự cố (Lỗi 500). Vui lòng thử lại sau ít phút hoặc liên hệ quản trị viên.';
  }

  // 2. Kiểm tra nếu mất kết nối mạng hoặc server không phản hồi
  if (error?.code === 'ERR_NETWORK' || !error?.response) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại.';
  }

  // 3. Lấy dữ liệu phản hồi từ backend (xử lý cả khi response.data là string JSON hoặc object)
  let data = error?.response?.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      // nếu là chuỗi thuần không phải JSON
    }
  }

  const backendMessage = data?.message || data?.error;

  if (backendMessage) {
    if (backendMessage === 'Invalid email/code or password') {
      return 'Email/mã số hoặc mật khẩu không chính xác.';
    }
    if (backendMessage === 'User account is inactive') {
      return 'Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt.';
    }
    if (backendMessage === 'Unexpected server error') {
      return 'Hệ thống máy chủ đang gặp sự cố (Lỗi 500). Vui lòng thử lại sau ít phút.';
    }
    return backendMessage;
  }

  return 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin tài khoản.';
}

/**
 * Giao diện Đăng nhập (LoginPage) cho hệ thống AI Oral Examination
 * Tích hợp API POST /api/auth/login và điều hướng theo Role người dùng
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();

  // State quản lý thông tin đăng nhập
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // State quản lý trạng thái ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);

  // State trạng thái tải dữ liệu và thông báo lỗi
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showIntroduction, setShowIntroduction] = useState(false);
  const [isWelcoming, setIsWelcoming] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');
  const [destination, setDestination] = useState('');
  const [isCompactLayout, setIsCompactLayout] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const mediaQuery = window.matchMedia('(max-width: 900px)');
    const updateLayout = () => setIsCompactLayout(mediaQuery.matches);
    updateLayout();
    mediaQuery.addEventListener('change', updateLayout);
    return () => mediaQuery.removeEventListener('change', updateLayout);
  }, []);

  useEffect(() => {
    if (!isWelcoming || !destination) return undefined;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const timeout = window.setTimeout(() => navigate(destination, { replace: true }), reducedMotion ? 650 : 1500);
    return () => window.clearTimeout(timeout);
  }, [destination, isWelcoming, navigate]);

  // Xử lý sự kiện đăng nhập khi người dùng nhấn nút Submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      // Gửi yêu cầu đăng nhập tới API /api/auth/login
      const loggedInUser = await login({ email: email.trim(), password });

      if (loggedInUser.mustChangePassword) {
        navigate('/change-password', { replace: true });
        return;
      }

      // Keep the welcome state visible before entering the role-specific area.
      const role = loggedInUser?.role;
      let nextPath = '/student/dashboard';
      if (role === 'ADMIN') {
        nextPath = '/admin/dashboard';
      } else if (role === 'LECTURER') {
        nextPath = '/lecturer/dashboard';
      }
      setWelcomeName(loggedInUser?.fullName?.trim() || email.trim());
      setDestination(nextPath);
      setShowIntroduction(true);
      setIsWelcoming(true);
    } catch (error: any) {
      // Xử lý lỗi và hiển thị thông báo rõ ràng cho người dùng
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={`login-screen${showIntroduction ? ' show-introduction' : ''}${isWelcoming ? ' is-welcoming' : ''}`}>
      <div className="login-language-control"><LanguageSelector /></div>
      <section
        className="login-panel"
        aria-label={t('Đăng nhập')}
        aria-hidden={false}
      >
        <div className="login-card">
          <div className={`login-form-content${isWelcoming ? ' is-hidden' : ''}`} aria-hidden={isWelcoming}>
            <div className="login-header">
              <div className="login-brand-row">
                <div className="login-logo-icon" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                  </svg>
                </div>
                <div className="login-brand-copy">
                  <strong>AiViva</strong>
                  <span>{t('Hệ thống thi vấn đáp trực tuyến hỗ trợ bởi AI')}</span>
                </div>
              </div>
              <h1 className="login-title">{t('Đăng nhập')}</h1>
              <p className="login-subtitle">{t('Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.')}</p>
            </div>

            {errorMessage && (
              <div className="login-error-alert" role="alert">
                <svg className="login-error-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{t(errorMessage)}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">{t('Email')}</label>
                <div className="login-input-shell">
                  <span className="login-input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    className="form-input has-leading-icon"
                    placeholder={t('Nhập email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || isWelcoming}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">{t('Mật khẩu')}</label>
                <div className="password-input-wrapper">
                  <span className="login-input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" /></svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input password-input has-leading-icon"
                    placeholder={t('Nhập mật khẩu')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || isWelcoming}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isLoading || isWelcoming}
                    aria-label={t(showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu')}
                    title={t(showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu')}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="forgot-password-row">
                <Link to="/404" className="forgot-password-link" tabIndex={isWelcoming ? -1 : undefined}>{t('Quên mật khẩu?')}</Link>
              </div>
              <button type="submit" className="login-submit-btn" disabled={isLoading || isWelcoming}>
                {isLoading ? t('Đang đăng nhập...') : t('Đăng nhập')}
              </button>
              <div className="register-link-row">
                <Link to="/register" className="register-link" tabIndex={isWelcoming ? -1 : undefined}>{t('Chưa có tài khoản? Đăng ký ngay')}</Link>
              </div>
            </form>
          </div>

          <div className={`login-welcome${isWelcoming ? ' is-visible' : ''}`} aria-live="polite" aria-hidden={!isWelcoming}>
            <span className="login-welcome-check" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none"><path d="m5 12.5 4.5 4.5L19 7" /></svg>
            </span>
            <p>{t('Chào mừng')}</p>
            <h2>{welcomeName}</h2>
            <span className="login-welcome-caption">{t('Bạn đã đăng nhập thành công.')}</span>
          </div>
        </div>
      </section>

      <aside
        className="login-feature-panel"
        id="login-introduction"
        aria-label={t('Giới thiệu AiViva')}
        aria-hidden={isCompactLayout && !showIntroduction}
      >
        <div className="login-feature-image" aria-hidden="true">
          <img src="/images/login-study.jpg" alt="" />
        </div>
        <div className="login-feature-copy">
          <p className="login-feature-eyebrow">AiViva</p>
          <h2><span>AI</span> Oral Examination</h2>
          <p className="login-feature-description">{t('Hệ thống thi vấn đáp trực tuyến hỗ trợ bởi AI')}</p>
          <ul className="login-feature-list">
            <li>
              <span className="login-feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z" /></svg>
              </span>
              <span><strong>{t('Thiết kế đề thi linh hoạt')}</strong><small>{t('Tạo đề thi nhanh chóng theo chủ đề.')}</small></span>
            </li>
            <li>
              <span className="login-feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><path d="M9 4a3 3 0 0 0-5 2v1a3 3 0 0 0-1 5 3.5 3.5 0 0 0 2 6 3 3 0 0 0 5 2V4Zm6 0a3 3 0 0 1 5 2v1a3 3 0 0 1 1 5 3.5 3.5 0 0 1-2 6 3 3 0 0 1-5 2V4Z" /><path d="M8 9h1m-1 6h1m6-6h1m-1 6h1" /></svg>
              </span>
              <span><strong>{t('Hỗ trợ đánh giá bởi AI')}</strong><small>{t('Đánh giá nhất quán và khách quan với AI hỗ trợ.')}</small></span>
            </li>
            <li>
              <span className="login-feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></svg>
              </span>
              <span><strong>{t('An toàn & Bảo mật')}</strong><small>{t('Bảo vệ dữ liệu và quyền riêng tư người học.')}</small></span>
            </li>
          </ul>
        </div>
      </aside>

    </main>
  );
}
