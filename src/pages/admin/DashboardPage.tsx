import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';
import { getUsers } from '../../services/userService';
import type { UserResponse } from '../../types/user';
import { useLanguage } from '../../context/LanguageContext';
import './DashboardPage.css';

type DashboardIconName = 'users' | 'student' | 'lecturer' | 'settings' | 'book' | 'assignments' | 'history' | 'arrow';

function DashboardIcon({ name, size = 18 }: { name: DashboardIconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === 'users' && <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M3 20v-1.5a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4V20M16 5a3.5 3.5 0 0 1 0 6.8M17 14.5a4 4 0 0 1 4 4V20" />
      </>}
      {name === 'student' && <>
        <path d="m2.5 9 9.5-5 9.5 5-9.5 5-9.5-5Z" />
        <path d="M6 11v5c3.5 2.7 8.5 2.7 12 0v-5m3-2v6" />
      </>}
      {name === 'lecturer' && <>
        <rect x="3" y="4" width="18" height="13" rx="1.5" />
        <path d="M8 20l4-3 4 3M8 9h3m-3 4h7" />
      </>}
      {name === 'settings' && <>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2.5v2m0 15v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2.5 12h2m15 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>}
      {name === 'book' && <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" />
        <path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8m-8 4h8" />
      </>}
      {name === 'assignments' && <>
        <path d="M4 7h15m0 0-3-3m3 3-3 3M20 17H5m0 0 3 3m-3-3 3-3" />
      </>}
      {name === 'history' && <>
        <path d="M3 11a9 9 0 1 1 2.6 6.4L3 15m0-4V6m0 5h5m4-5v6l4 2" />
      </>}
      {name === 'arrow' && <path d="M5 12h14m-6-6 6 6-6 6" />}
    </svg>
  );
}

function normalizedRole(user: UserResponse): string {
  return `${user.roleName || ''} ${user.role?.roleCode || ''} ${user.role?.roleName || ''}`.toLocaleUpperCase();
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let active = true;
    setState('loading');
    setErrorMessage('');
    getUsers()
      .then((data) => {
        if (active) {
          setUsers(data);
          setState('ready');
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách tài khoản.');
          setState('error');
        }
      });
    return () => { active = false; };
  }, [retryToken]);

  const roleCounts = [
    { name: t('Sinh viên'), match: /\b(ST|STUDENT)\b/, icon: 'student' as const },
    { name: t('Giảng viên'), match: /\b(LE|LECTURER)\b/, icon: 'lecturer' as const },
    { name: t('Quản trị viên'), match: /\b(AD|ADMIN)\b/, icon: 'settings' as const },
  ];

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-heading">
        <div><span className="admin-dashboard-eyebrow">{t('QUẢN TRỊ NỀN TẢNG')}</span><h1>{t('Tổng quan hệ thống')}</h1><p>{t('Theo dõi tài khoản và truy cập các công cụ quản trị AiViva.')}</p></div>
        <Link to={APP_ROUTES.admin.users} className="admin-dashboard-primary">{t('Quản lý tài khoản')} <DashboardIcon name="arrow" size={16} /></Link>
      </header>

      <section className="admin-dashboard-users-panel">
        <div className="admin-dashboard-section-title">
          <div><h2>{t('Tài khoản người dùng')}</h2><p>{t('Số liệu lấy trực tiếp từ dịch vụ quản lý người dùng.')}</p></div>
          {state === 'ready' && <span className="admin-live-indicator"><i /> {t('Dữ liệu tải từ hệ thống')}</span>}
        </div>
        {state === 'loading' ? (
          <div className="admin-dashboard-state" role="status">{t('Đang tải số liệu tài khoản…')}</div>
        ) : state === 'error' ? (
          <div className="admin-dashboard-error" role="alert">
            <strong>{t('Không thể tải số liệu tài khoản.')}</strong>
            <span>{t(errorMessage)}</span>
            <button type="button" onClick={() => setRetryToken((token) => token + 1)}>{t('Thử lại')}</button>
          </div>
        ) : (
          <div className="admin-dashboard-stat-grid">
            <article className="admin-stat-card admin-stat-total"><span className="admin-stat-icon"><DashboardIcon name="users" /></span><small>{t('Tổng tài khoản')}</small><strong>{users.length}</strong><span className="admin-stat-caption">{t('Tài khoản được API trả về')}</span></article>
            {roleCounts.map((role) => {
              const count = users.filter((user) => role.match.test(normalizedRole(user))).length;
              return <article className="admin-stat-card" key={role.name}><span className="admin-stat-icon"><DashboardIcon name={role.icon} /></span><small>{role.name}</small><strong>{count}</strong><span className="admin-stat-caption">{t('Theo vai trò trong dữ liệu trả về')}</span></article>;
            })}
          </div>
        )}
      </section>

      <section className="admin-dashboard-quick-links">
        <div className="admin-dashboard-section-title"><div><h2>{t('Công cụ quản trị')}</h2><p>{t('Truy cập các khu vực quản lý hệ thống.')}</p></div></div>
        <div className="admin-dashboard-link-grid">
          <Link to={APP_ROUTES.admin.users}><span><DashboardIcon name="users" /></span><strong>{t('Tài khoản & vai trò')}</strong><small>{t('Tạo, lọc, cập nhật trạng thái và quản lý tài khoản.')}</small><b aria-hidden="true"><DashboardIcon name="arrow" size={15} /></b></Link>
          <Link to={APP_ROUTES.admin.subjects}><span><DashboardIcon name="book" /></span><strong>{t('Môn học')}</strong><small>{t('Quản lý thông tin môn học của hệ thống.')}</small><b aria-hidden="true"><DashboardIcon name="arrow" size={15} /></b></Link>
          <Link to={APP_ROUTES.admin.subjectAssignments}><span><DashboardIcon name="assignments" /></span><strong>{t('Phân công giảng viên')}</strong><small>{t('Quản lý liên kết môn học và giảng viên.')}</small><b aria-hidden="true"><DashboardIcon name="arrow" size={15} /></b></Link>
          <Link to={APP_ROUTES.admin.settings}><span><DashboardIcon name="settings" /></span><strong>{t('Cấu hình hệ thống')}</strong><small>{t('Cấu hình nền tảng và tùy chọn ngôn ngữ khi API hỗ trợ.')}</small><b aria-hidden="true"><DashboardIcon name="arrow" size={15} /></b></Link>
          <Link to={APP_ROUTES.admin.auditLogs}><span><DashboardIcon name="history" /></span><strong>{t('Nhật ký hệ thống')}</strong><small>{t('Tra cứu hoạt động quản trị được backend ghi nhận.')}</small><b aria-hidden="true"><DashboardIcon name="arrow" size={15} /></b></Link>
        </div>
      </section>
    </div>
  );
}
