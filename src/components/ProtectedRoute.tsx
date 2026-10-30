import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './PageLoader';

interface Props {
  readonly children: ReactNode;
  readonly role?: 'admin';
}

/**
 * Protección de UX: oculta pantallas al usuario sin permisos.
 * NO es una medida de seguridad por sí sola: los datos de /admin solo los entrega
 * una RPC que verifica is_admin() en Postgres.
 */
export function ProtectedRoute({ children, role }: Props) {
  const { user, profile, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <PageLoader />;
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (role === 'admin' && profile?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}
