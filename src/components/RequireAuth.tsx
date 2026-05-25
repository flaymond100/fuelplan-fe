import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../hooks/useSession';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();
  const location = useLocation();

  if (loading) return null;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}
