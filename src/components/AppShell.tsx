import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, Brain, CreditCard, LayoutDashboard, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

const AppShell = ({ title, subtitle, children, action }: AppShellProps) => {
  const { session } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.12),transparent_35%),linear-gradient(135deg,#020617,#0f172a_55%,#09090b)]" />
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to={session ? '/dashboard' : '/'} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/30">
              <Brain className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <div className="font-semibold tracking-tight">Shepard Advisor</div>
              <div className="text-xs text-slate-500">Market Intelligence</div>
            </div>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white">
              <Link to="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white">
              <Link to="/analysis">
                <BarChart3 className="mr-2 h-4 w-4" />
                Market Lab
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white">
              <Link to="/pricing">
                <CreditCard className="mr-2 h-4 w-4" />
                Pricing
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {action}
            {session ? (
              <Button onClick={handleLogout} variant="outline" size="sm" className="border-slate-700 bg-slate-900">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            ) : (
              <Button asChild size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                <Link to="/login">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};

export default AppShell;
