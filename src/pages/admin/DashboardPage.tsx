import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';

export default function DashboardPage() {
  return (
    <div className="users-page-container">
      <div className="card-panel" style={{ padding: '2rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: '#1e293b' }}>
          Welcome to AIVES Admin Portal
        </h2>
        <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.9375rem' }}>
          Hệ thống quản lý phân quyền và tài khoản người dùng cho AIVES.
        </p>

        <div style={{ marginTop: '1rem' }}>
          <Link
            to={APP_ROUTES.admin.users}
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            Go to User Management &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
