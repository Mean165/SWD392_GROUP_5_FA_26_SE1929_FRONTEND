import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';
import { getUserById } from '../services/userService';
import type { UserResponse } from '../types/user';

const navItems = [
  {
    to: APP_ROUTES.lecturer.dashboard,
    label: 'Tổng quan',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    to: APP_ROUTES.lecturer.questions,
    label: 'Ngân hàng câu hỏi',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
        <path d="M6 6h10" />
        <path d="M6 10h10" />
      </svg>
    ),
  },
  {
    to: APP_ROUTES.lecturer.rubrics,
    label: 'Tiêu chí chấm (Rubric)',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    to: APP_ROUTES.lecturer.exams,
    label: 'Ca thi & Đề thi',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    to: APP_ROUTES.lecturer.evaluations,
    label: 'Chấm điểm',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    to: APP_ROUTES.lecturer.monitoring,
    label: 'Giám sát thi',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
  },
  {
    to: APP_ROUTES.lecturer.reports,
    label: 'Báo cáo & Thống kê',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export default function LecturerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [lecturerProfile, setLecturerProfile] = useState<UserResponse | null>(null);

  useEffect(() => {
    let isMounted = true;
    getUserById('me')
      .then((data) => {
        if (isMounted && data) {
          setLecturerProfile(data);
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

  const getPageBreadcrumb = () => {
    if (location.pathname.includes('/questions/create')) return 'Tạo câu hỏi mới';
    if (location.pathname.includes('/questions/rubrics') || location.pathname.includes('/rubrics')) return 'Tiêu chí chấm (Rubric)';
    if (location.pathname.includes('/questions')) return 'Ngân hàng câu hỏi';
    if (location.pathname.includes('/exams')) return 'Ca thi & Đề thi';
    if (location.pathname.includes('/evaluations')) return 'Đánh giá & Chấm điểm';
    if (location.pathname.includes('/monitoring')) return 'Giám sát thi';
    if (location.pathname.includes('/reports')) return 'Báo cáo & Thống kê';
    return 'Tổng quan';
  };

  const displayName = lecturerProfile?.fullName || authUser?.fullName || 'TS. Nguyễn Thị Minh';
  const displayEmail = lecturerProfile?.email || authUser?.email || 'minhnt@aives.edu.vn';
  const initial = displayName.charAt(0).toUpperCase() || 'G';

  return (
    <div className="min-h-screen flex bg-slate-100/70 text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 sticky top-0 h-screen z-20">
        {/* Brand header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold text-base shadow-sm shadow-indigo-200">
            A
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-base tracking-tight leading-tight">AIVES</span>
            <span className="text-[11px] text-indigo-600 font-semibold tracking-wide uppercase">Cổng Giảng viên</span>
          </div>
        </div>

        {/* Navigation menu */}
        <nav className="p-3.5 space-y-1.5 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-600 rounded-r-full" />
                  )}
                  <span
                    className={`w-5 h-5 flex items-center justify-center ${
                      isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600 transition-colors'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-10 shadow-xs">
          {/* Sleek Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="text-slate-400 font-medium">Hệ thống AIVES</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-md text-xs border border-slate-200/60">
              {getPageBreadcrumb()}
            </span>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 pl-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-indigo-100 ring-offset-1 shadow-xs">
                {initial}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight" title={displayEmail}>
                  {displayName}
                </span>
                <span className="text-[10px] text-indigo-600 font-medium">Giảng viên bộ môn</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="ml-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 px-3 py-1.5 rounded-xl transition-all shadow-xs"
              title="Đăng xuất khỏi hệ thống"
            >
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 min-w-0 p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
