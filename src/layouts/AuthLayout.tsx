import { Outlet, useLocation } from 'react-router-dom';
import LanguageSelector from '../components/common/LanguageSelector';
import './AuthLayout.css';

export default function AuthLayout() {
  const { pathname } = useLocation();
  return (
    <div className="auth-layout">
      {pathname !== '/login' && <div className="auth-language-selector"><LanguageSelector showLabel /></div>}
      <Outlet />
    </div>
  );
}
