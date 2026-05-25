import { Navigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';

export default function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();

  if (loading) return null;
  if (session) return <Navigate to="/app" replace />;
  return <>{children}</>;
}
