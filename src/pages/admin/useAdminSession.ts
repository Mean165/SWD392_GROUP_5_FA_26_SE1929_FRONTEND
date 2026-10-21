import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function useAdminSession() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handlingUnauthorized = useRef(false);

  return useCallback(async () => {
    if (handlingUnauthorized.current) return;
    handlingUnauthorized.current = true;
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  }, [logout, navigate]);
}
