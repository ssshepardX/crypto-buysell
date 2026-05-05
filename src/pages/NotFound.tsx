import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn('Route not found:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="max-w-md text-center">
        <div className="text-sm font-medium text-cyan-300">404</div>
        <h1 className="mt-2 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm text-slate-400">
          The page may have moved or the link may be outdated.
        </p>
        <Button asChild className="mt-6 bg-cyan-500 hover:bg-cyan-600">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
