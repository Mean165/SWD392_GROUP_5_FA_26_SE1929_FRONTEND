import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../../services/auth/authService';
import './RegisterPage.css';

/**
 * Giao diện Đăng ký (RegisterPage) cho hệ thống AI Oral Examination
 * Đồng bộ phong cách thiết kế với trang Đăng nhập (LoginPage)
 */
export default function RegisterPage() {
  const navigate = useNavigate();

  // State quản lý giá trị các trường nhập liệu
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State quản lý ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);

  // State trạng thái tải dữ liệu, thông báo lỗi và thông báo thành công
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Xử lý sự kiện đăng ký khi submit form
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Kiểm tra cơ bản: Họ và tên không được để trống
    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên.');
      return;
    }

    // Kiểm tra định dạng email: <...>@<...>
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Email không đúng định dạng (ví dụ: sinhvien@fpt.edu.vn).');
      return;
    }

    // Kiểm tra độ dài mật khẩu: tối thiểu 6 kí tự
    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có tối thiểu 6 kí tự.');
      return;
    }

    // Kiểm tra so khớp mật khẩu và xác nhận mật khẩu
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu và xác nhận mật khẩu không khớp.');
      return;
    }

    setIsLoading(true);

    try {
      // Gửi yêu cầu đăng ký tới API /api/auth/register
      // Không gửi studentOrStaffCode và roleCode vì hệ thống sẽ tự sinh
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      setSuccessMessage('Đăng ký tài khoản thành công! Đang chuyển hướng đến trang đăng nhập...');
      // Chuyển hướng sang trang Đăng nhập sau 1.5 giây
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Đăng ký không thành công. Vui lòng thử lại.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-card">
      {/* Header của Card: Logo icon học tập/AI, Tiêu đề & Phụ đề */}
      <div className="register-header">
        <div className="register-logo-icon" aria-hidden="true">
          {/* Biểu tượng công nghệ / thi cử */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
          </svg>
        </div>
        <h1 className="register-title">AI Oral Examination</h1>
        <p className="register-subtitle">Đăng ký tài khoản tham gia thi vấn đáp trực tuyến</p>
      </div>

      {/* Hiển thị thông báo lỗi nếu có */}
      {errorMessage && (
        <div className="register-error-alert" role="alert">
          <svg
            className="register-alert-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Hiển thị thông báo thành công nếu có */}
      {successMessage && (
        <div className="register-success-alert" role="status">
          <svg
            className="register-alert-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form đăng ký */}
      <form onSubmit={handleSubmit} className="register-form">
        {/* Ô nhập Họ và tên */}
        <div className="form-group">
          <label htmlFor="fullName" className="form-label">
            Họ và tên
          </label>
          <input
            id="fullName"
            type="text"
            className="form-input"
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
            required
            autoComplete="name"
          />
        </div>

        {/* Ô nhập Email */}
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            id="email"
            type="text"
            className="form-input"
            placeholder="example@fpt.edu.vn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            autoComplete="email"
          />
        </div>

        {/* Ô nhập Mật khẩu kèm nút ẩn/hiện mật khẩu */}
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Mật khẩu
          </label>
          <div className="password-input-wrapper">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="form-input password-input"
              placeholder="Nhập mật khẩu (tối thiểu 6 kí tự)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isLoading}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? (
                /* Icon ẩn mật khẩu (mắt gạch chéo) */
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                /* Icon hiện mật khẩu (mắt) */
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Ô nhập Xác nhận mật khẩu */}
        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            Xác nhận mật khẩu
          </label>
          <input
            id="confirmPassword"
            type="password"
            className="form-input"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            required
            autoComplete="new-password"
          />
        </div>

        {/* Tùy chọn liên kết: Đã có tài khoản? Đăng nhập ngay */}
        <div className="login-link-row">
          <Link to="/login" className="login-link">
            Đã có tài khoản? Đăng nhập ngay
          </Link>
        </div>

        {/* Nút Submit lớn màu xanh dương */}
        <button type="submit" className="register-submit-btn" disabled={isLoading}>
          {isLoading ? 'Đang đăng ký...' : 'Register'}
        </button>
      </form>
    </div>
  );
}
