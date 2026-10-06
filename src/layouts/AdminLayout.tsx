import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';
import { getUserById } from '../services/userService';
import type { UserResponse } from '../types/user';
import './AdminLayout.css';

const navItems = [
  {
    to: APP_ROUTES.admin.dashboard,
    label: 'Tổng quan',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    to: APP_ROUTES.admin.examSessions,
    label: 'Ca thi & Lịch thi',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    to: APP_ROUTES.admin.users,
    label: 'Người dùng',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [adminProfile, setAdminProfile] = useState<UserResponse | null>(null);

  useEffect(() => {
    let isMounted = true;
    getUserById('me')
      .then((data) => {
        if (isMounted && data) {
          setAdminProfile(data);
        }
      })
      .catch(() => {
        // Fallback
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const pageTitle = location.pathname.includes('/exam-sessions')
    ? 'Quản lý Ca thi & Lịch thi'
    : location.pathname.includes('/users')
    ? 'Quản lý Người dùng'
    : 'Tổng quan Hệ thống Quản trị';

  const displayName = adminProfile?.fullName || authUser?.fullName || 'Quản trị viên';
  const displayEmail = adminProfile?.email || authUser?.email || 'admin@aives.edu.vn';
  const initial = displayName.charAt(0).toUpperCase() || 'Q';

  return (
    <div className="admin-layout-shell">
      {/* Sidebar bên trái */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-brand-icon">A</div>
          <div className="admin-brand-text">
            <span className="admin-brand-title">AIVES</span>
            <span className="admin-brand-subtitle">Cổng Quản trị</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `admin-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main panel bên phải */}
      <div className="admin-main-panel">
        <header className="admin-top-header">
          <div className="admin-header-title">{pageTitle}</div>

          <div className="admin-header-user-info">
            <div className="admin-user-profile-summary">
              <div className="admin-avatar-circle">{initial}</div>
              <div className="admin-user-details">
                <span className="admin-user-name" title={displayEmail}>
                  {displayName}
                </span>
                <span className="admin-user-role-badge">Admin</span>
              </div>
            </div>

            <button
              type="button"
              className="admin-logout-btn"
              onClick={handleLogout}
              title="Đăng xuất khỏi hệ thống"
            >
              Đăng xuất
            </button>
          </div>
        </header>

        <main className="admin-content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
