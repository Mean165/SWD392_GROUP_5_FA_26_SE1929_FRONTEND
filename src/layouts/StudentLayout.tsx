import { NavLink, Outlet } from 'react-router-dom';
import { APP_ROUTES } from '../constants/routes';

const links = [
  { to: APP_ROUTES.student.dashboard, label: 'Dashboard' },
  { to: APP_ROUTES.student.exams, label: 'Exams' },
  { to: APP_ROUTES.student.reports.replace(':id', 'me'), label: 'Reports' },
];

export default function StudentLayout() {
  return (
    <div className="layout-shell">
      <aside className="sidebar">
        <h3>Student</h3>
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
