import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

type Status = 'verifying' | 'success' | 'error';

const ConfirmEmail = () => {
  const [status, setStatus] = useState<Status>('verifying');
  const navigate = useNavigate();
  const redirectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handleVerifiedSession = () => {
      if (!isMounted) return;

      setStatus('success');
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
      redirectTimerRef.current = window.setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 3000);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        handleVerifiedSession();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleVerifiedSession();
      }
    });

    const timer = window.setTimeout(() => {
      if (isMounted) {
        setStatus((currentStatus) => (
          currentStatus === 'verifying' ? 'error' : currentStatus
        ));
      }
    }, 10000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.clearTimeout(timer);
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, [navigate]);

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="flex flex-col items-center text-center">
            <Loader2 className="mb-4 h-12 w-12 animate-spin" />
            <CardTitle>Verifying email</CardTitle>
            <p className="mt-2 text-muted-foreground">Please wait a few seconds.</p>
          </div>
        );
      case 'success':
        return (
          <div className="flex flex-col items-center text-center">
            <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
            <CardTitle>Email verified</CardTitle>
            <p className="mt-2 text-muted-foreground">Your account is ready. Redirecting to dashboard...</p>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center text-center">
            <XCircle className="mb-4 h-12 w-12 text-red-500" />
            <CardTitle>Verification failed</CardTitle>
            <p className="mt-2 text-muted-foreground">
              The verification link may be invalid or expired. Sign in again or request a new code.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild>
                <Link to="/login">Back to login</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">Home</Link>
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader />
        <CardContent className="p-8">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmEmail;
