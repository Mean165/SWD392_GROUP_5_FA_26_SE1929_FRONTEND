import { NavLink, Outlet } from 'react-router-dom';
import { APP_ROUTES } from '../constants/routes';

const links = [
  { to: APP_ROUTES.lecturer.dashboard, label: 'Dashboard' },
  { to: APP_ROUTES.lecturer.questions, label: 'Questions' },
  { to: APP_ROUTES.lecturer.rubrics, label: 'Rubrics' },
  { to: APP_ROUTES.lecturer.exams, label: 'Exams' },
  { to: APP_ROUTES.lecturer.evaluations, label: 'Evaluations' },
  { to: APP_ROUTES.lecturer.monitoring, label: 'Monitoring' },
  { to: APP_ROUTES.lecturer.reports, label: 'Reports' },
];

export default function LecturerLayout() {
  return (
    <div className="layout-shell">
      <aside className="sidebar">
        <h3>Lecturer</h3>
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
