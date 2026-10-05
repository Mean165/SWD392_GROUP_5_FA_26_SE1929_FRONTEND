import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
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

  // State quản lý thông tin đăng nhập
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // State quản lý trạng thái ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);

  // State trạng thái tải dữ liệu và thông báo lỗi
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Xử lý sự kiện đăng nhập khi người dùng nhấn nút Submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      // Gửi yêu cầu đăng nhập tới API /api/auth/login
      const loggedInUser = await login({ email: email.trim(), password });

      // Điều hướng người dùng dựa theo Role trả về từ backend
      const role = loggedInUser?.role;
      if (role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'LECTURER') {
        navigate('/lecturer/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (error: any) {
      // Xử lý lỗi và hiển thị thông báo rõ ràng cho người dùng
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-card">
      {/* Header của Card: Biểu tượng thi cử, Tiêu đề & Phụ đề */}
      <div className="login-header">
        <div className="login-logo-icon" aria-hidden="true">
          {/* SVG Biểu tượng công nghệ / thi cử */}
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
        <h1 className="login-title">AI Oral Examination</h1>
        <p className="login-subtitle">Hệ thống thi vấn đáp trực tuyến hỗ trợ bởi AI</p>
      </div>

      {/* Hiển thị thông báo lỗi nếu có */}
      {errorMessage && (
        <div className="login-error-alert" role="alert">
          <svg
            className="login-error-icon"
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

      {/* Form đăng nhập */}
      <form onSubmit={handleSubmit} className="login-form">
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
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="current-password"
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

        {/* Tùy chọn liên kết Quên mật khẩu */}
        <div className="forgot-password-row">
          <Link to="/404" className="forgot-password-link">
            Quên mật khẩu?
          </Link>
        </div>

        {/* Nút Submit lớn màu xanh dương */}
        <button type="submit" className="login-submit-btn" disabled={isLoading}>
          {isLoading ? 'Đang đăng nhập...' : 'Login'}
        </button>

        {/* Tùy chọn liên kết Đăng ký tài khoản */}
        <div className="register-link-row">
          <Link to="/register" className="register-link">
            Chưa có tài khoản? Đăng ký ngay
          </Link>
        </div>
      </form>
    </div>
  );
}
