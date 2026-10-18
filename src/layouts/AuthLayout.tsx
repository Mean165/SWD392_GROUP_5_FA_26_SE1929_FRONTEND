import { Outlet } from 'react-router-dom';
import LanguageSelector from '../components/common/LanguageSelector';
import './AuthLayout.css';

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-language-selector"><LanguageSelector showLabel /></div>
      <Outlet />
    </div>
  );
}
