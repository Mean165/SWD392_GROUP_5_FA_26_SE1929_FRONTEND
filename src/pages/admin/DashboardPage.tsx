import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';
import { getUsers } from '../../services/userService';
import type { UserResponse } from '../../types/user';
import { useLanguage } from '../../context/LanguageContext';
import './DashboardPage.css';

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
    { name: t('Sinh viên'), match: /\b(ST|STUDENT)\b/, icon: '♙' },
    { name: t('Giảng viên'), match: /\b(LE|LECTURER)\b/, icon: '▣' },
    { name: t('Quản trị viên'), match: /\b(AD|ADMIN)\b/, icon: '⚙' },
  ];

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-heading">
        <div><span className="admin-dashboard-eyebrow">{t('QUẢN TRỊ NỀN TẢNG')}</span><h1>{t('Tổng quan hệ thống')}</h1><p>{t('Theo dõi tài khoản và truy cập các công cụ quản trị AiViva.')}</p></div>
        <Link to={APP_ROUTES.admin.users} className="admin-dashboard-primary">{t('Quản lý tài khoản')} <span aria-hidden="true">→</span></Link>
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
            <article className="admin-stat-card admin-stat-total"><span className="admin-stat-icon">♙</span><small>{t('Tổng tài khoản')}</small><strong>{users.length}</strong><span className="admin-stat-caption">{t('Tài khoản được API trả về')}</span></article>
            {roleCounts.map((role) => {
              const count = users.filter((user) => role.match.test(normalizedRole(user))).length;
              return <article className="admin-stat-card" key={role.name}><span className="admin-stat-icon">{role.icon}</span><small>{role.name}</small><strong>{count}</strong><span className="admin-stat-caption">{t('Theo vai trò trong dữ liệu trả về')}</span></article>;
            })}
          </div>
        )}
      </section>

      <section className="admin-dashboard-quick-links">
        <div className="admin-dashboard-section-title"><div><h2>{t('Công cụ quản trị')}</h2><p>{t('Truy cập các khu vực quản lý hệ thống.')}</p></div></div>
        <div className="admin-dashboard-link-grid">
          <Link to={APP_ROUTES.admin.users}><span>♙</span><strong>{t('Tài khoản & vai trò')}</strong><small>{t('Tạo, lọc, cập nhật trạng thái và quản lý tài khoản.')}</small><b aria-hidden="true">→</b></Link>
          <Link to={APP_ROUTES.admin.subjects}><span>▤</span><strong>{t('Môn học')}</strong><small>{t('Quản lý thông tin môn học của hệ thống.')}</small><b aria-hidden="true">→</b></Link>
          <Link to={APP_ROUTES.admin.subjectAssignments}><span>⇄</span><strong>{t('Phân công giảng viên')}</strong><small>{t('Quản lý liên kết môn học và giảng viên.')}</small><b aria-hidden="true">→</b></Link>
          <Link to={APP_ROUTES.admin.settings}><span>⚙</span><strong>{t('Cấu hình hệ thống')}</strong><small>{t('Cấu hình nền tảng và tùy chọn ngôn ngữ khi API hỗ trợ.')}</small><b aria-hidden="true">→</b></Link>
          <Link to={APP_ROUTES.admin.auditLogs}><span>◷</span><strong>{t('Nhật ký hệ thống')}</strong><small>{t('Tra cứu hoạt động quản trị được backend ghi nhận.')}</small><b aria-hidden="true">→</b></Link>
        </div>
      </section>
    </div>
  );
}
