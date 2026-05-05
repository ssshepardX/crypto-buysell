import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Skeleton } from '@/components/ui/skeleton';

const ProtectedRoute = () => {
  const { session, loading } = useSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-20 w-1/3" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to={`/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
