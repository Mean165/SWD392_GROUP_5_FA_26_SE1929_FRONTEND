import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LanguageProvider } from '../../context/LanguageContext';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import LoginPage from './LoginPage';

const authMocks = vi.hoisted(() => ({ login: vi.fn() }));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ login: authMocks.login }),
}));

function CurrentPath() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

const renderLoginPage = () => render(
  <LanguageProvider>
    <MemoryRouter initialEntries={['/login']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<CurrentPath />} />
      </Routes>
    </MemoryRouter>
  </LanguageProvider>,
);

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.setItem('aiviva-language', 'vi');
    authMocks.login.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the student name in the welcome state before navigating to the student area', async () => {
    authMocks.login.mockResolvedValue({ fullName: 'Minh Anh', role: 'STUDENT' });
    renderLoginPage();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'minh.anh@example.com' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByRole('heading', { name: 'Minh Anh' })).toBeInTheDocument();
    expect(document.querySelector('.login-screen')).toHaveClass('is-welcoming');
    expect(document.querySelector('.login-screen')).toHaveClass('show-introduction');
    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent('/student/dashboard'), { timeout: 2500 });
  });

  it('keeps the login form and reports an error when authentication fails', async () => {
    authMocks.login.mockRejectedValue(new Error('Invalid credentials'));
    renderLoginPage();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'student@example.com' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(document.querySelector('.login-screen')).not.toHaveClass('is-welcoming');
  });

  it('routes a temporary-password login directly to password change', async () => {
    authMocks.login.mockResolvedValue({ fullName: 'Minh Anh', role: 'STUDENT', mustChangePassword: true });
    renderLoginPage();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'minh.anh@example.com' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'temporary' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent('/change-password'));
  });

  it('shows the introduction beside the login form without a center arrow control', () => {
    renderLoginPage();

    expect(screen.getByRole('heading', { name: 'AI Oral Examination' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Ngôn ngữ giao diện' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Chuyển sang giới thiệu' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Quay lại đăng nhập' })).not.toBeInTheDocument();
  });
});
