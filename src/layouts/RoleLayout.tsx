import { useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';
import './RoleLayout.css';

export type RoleNavigationItem = {
  to: string;
  label: string;
  icon: string;
};

const iconPaths: Record<string, string> = {
  home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  calendar: 'M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16',
  history: 'M3 12a9 9 0 1 0 2.64-6.36L3 8 M3 4v4h4 M12 7v5l3 2',
  results: 'M4 19V5 M4 19h17 M8 15l4-4 3 2 5-7',
  materials: 'M5 4h14v17l-7-4-7 4z M9 8h6 M9 12h6',
  bell: 'M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  courses: 'M3 5h18v14H3z M3 10h18 M9 5v14',
  questions: 'M4 4h16v16H4z M8 8h8 M8 12h8 M8 16h5',
  rubric: 'M5 5h14 M5 12h14 M5 19h14 M8 3v4 M15 10v4 M11 17v4',
  grading: 'm5 12 4 4L19 6',
  monitoring: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  reports: 'M5 3h14v18H5z M8 8h8 M8 12h8 M8 16h5',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 2.94-.09-.03a1.7 1.7 0 0 0-1.79.4l-.07.07h-3.4l-.02-.1a1.7 1.7 0 0 0-1.25-1.3l-.1-.02-1.7-2.94.07-.07a1.7 1.7 0 0 0 .4-1.79l-.04-.1V10l.1-.02a1.7 1.7 0 0 0 1.3-1.25l.02-.1 2.94-1.7.07.07a1.7 1.7 0 0 0 1.79.4l.1-.04h3.4l.02.1a1.7 1.7 0 0 0 1.25 1.3l.1.02 1.7 2.94-.07.07a1.7 1.7 0 0 0-.4 1.79z',
  help: 'M9.1 9a3 3 0 1 1 5.8 1c-.6 1.4-2.9 2-2.9 4 M12 18h.01 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
};

function RoleIcon({ name }: { name: string }) {
  const path = iconPaths[name] || iconPaths.home;
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

type RoleLayoutProps = {
  role: 'student' | 'lecturer' | 'admin';
  roleLabel: string;
  navigation: RoleNavigationItem[];
};

export default function RoleLayout({ role, roleLabel, navigation }: RoleLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const displayName = user?.fullName || user?.username || roleLabel;
  const profilePath = `/${role}/profile`;
  const settingsPath = `/${role}/settings`;
  const activePage = [...navigation]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));

  const handleLogout = async () => {
    await logout();
    navigate(APP_ROUTES.login, { replace: true });
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchText.trim();
    if (role === 'student' && query) {
      navigate(`${APP_ROUTES.student.exams}?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="aiviva-shell">
      <aside className="aiviva-sidebar">
        <Link className="aiviva-brand" to={`/${role}/dashboard`} aria-label="AiViva trang chủ">
          <span className="aiviva-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="m12 2 2.7 6.8L22 12l-7.3 3.2L12 22l-2.7-6.8L2 12l7.3-3.2L12 2Z" />
            </svg>
          </span>
          <span className="aiviva-brand-copy">
            <strong>AiViva</strong>
            <small>AI Oral Exam Platform</small>
          </span>
        </Link>

        <div className="aiviva-sidebar-caption">MENU</div>
        <nav className="aiviva-navigation" aria-label={`Điều hướng ${roleLabel}`}>
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === `/${role}/dashboard`}
              className={({ isActive }) => `aiviva-nav-link${isActive ? ' active' : ''}`}
            >
              <span className="aiviva-nav-icon"><RoleIcon name={item.icon} /></span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="aiviva-sidebar-footer">
          {!navigation.some((item) => item.to === settingsPath) && (
            <NavLink to={settingsPath} className={({ isActive }) => `aiviva-nav-link${isActive ? ' active' : ''}`}>
              <span className="aiviva-nav-icon"><RoleIcon name="settings" /></span>
              <span>Cài đặt</span>
            </NavLink>
          )}
          {role === 'student' && (
            <NavLink to="/student/help" className={({ isActive }) => `aiviva-nav-link${isActive ? ' active' : ''}`}>
              <span className="aiviva-nav-icon"><RoleIcon name="help" /></span>
              <span>Trợ giúp</span>
            </NavLink>
          )}
        </div>
      </aside>

      <div className="aiviva-main">
        <header className="aiviva-topbar">
          {role === 'student' ? (
            <form className="aiviva-search" onSubmit={handleSearch}>
              <span className="aiviva-search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="10.8" cy="10.8" r="6.6" />
                  <path d="m16 16 4.2 4.2" />
                </svg>
              </span>
              <input
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Tìm kỳ thi trong lịch của tôi..."
                aria-label="Tìm kỳ thi trong lịch của tôi"
              />
              <button type="submit">Tìm kiếm</button>
            </form>
          ) : (
            <div className="aiviva-page-context">
              <span className="aiviva-context-overline">{roleLabel}</span>
              <strong>{activePage?.label || roleLabel}</strong>
            </div>
          )}
          <div className="aiviva-topbar-actions">
            {role === 'student' && (
              <Link className="aiviva-notification-link" to={APP_ROUTES.student.notifications} aria-label="Thông báo">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M10 21h4" />
                </svg>
              </Link>
            )}
            <div className="aiviva-profile-wrap">
              <button
                className="aiviva-profile-button"
                type="button"
                aria-expanded={profileMenuOpen}
                onClick={() => setProfileMenuOpen((open) => !open)}
              >
                <span className="aiviva-avatar">{displayName.charAt(0).toLocaleUpperCase()}</span>
                <span className="aiviva-profile-copy">
                  <strong>{displayName}</strong>
                  <small>{roleLabel}</small>
                </span>
                <span className={`aiviva-profile-chevron${profileMenuOpen ? ' open' : ''}`} aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none">
                    <path d="m5.5 7.5 4.5 4.5 4.5-4.5" />
                  </svg>
                </span>
              </button>
              {profileMenuOpen && (
                <div className="aiviva-profile-menu">
                  <Link to={profilePath} onClick={() => setProfileMenuOpen(false)}>Hồ sơ cá nhân</Link>
                  <Link to={settingsPath} onClick={() => setProfileMenuOpen(false)}>Cài đặt</Link>
                  {role === 'student' && <Link to="/student/help" onClick={() => setProfileMenuOpen(false)}>Trợ giúp</Link>}
                  <button type="button" onClick={handleLogout}>Đăng xuất</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="aiviva-content"><Outlet /></main>
      </div>
    </div>
  );
}
