import { NavLink, Outlet } from 'react-router-dom';
import { APP_ROUTES } from '../constants/routes';

const links = [
  { to: APP_ROUTES.admin.dashboard, label: 'Dashboard' },
  { to: APP_ROUTES.admin.users, label: 'Users' },
  { to: APP_ROUTES.admin.subjects, label: 'Subjects' },
  { to: APP_ROUTES.admin.subjectAssignments, label: 'Assignments' },
  { to: APP_ROUTES.admin.settings, label: 'Settings' },
];

export default function AdminLayout() {
  return (
    <div className="layout-shell">
      <aside className="sidebar">
        <h3>Admin</h3>
        <nav>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-panel">
        <Outlet />
      </main>
    </div>
  );
}
