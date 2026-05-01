import { useEffect, useState } from 'react';
import { Shield, Users, MessageSquare, RefreshCw } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AdminUser,
  ContactMessage,
  bootstrapAdmin,
  getAdminData,
  setMessageStatus,
  setUserRole,
  setUserSubscription,
} from '@/services/adminService';
import { Trans } from '@/contexts/LanguageContext';

const Admin = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminData();
      setUsers(data.users);
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin data failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const bootstrap = async () => {
    setError(null);
    try {
      await bootstrapAdmin(token);
      setToken('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bootstrap failed');
    }
  };

  return (
    <AppShell
      title="Admin"
      subtitle="Users, plans, contact messages."
      action={<Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300"><Shield className="mr-1 h-3 w-3" /><Trans text="Private" /></Badge>}
    >
      <div className="space-y-5">
        {error && (
          <Card className="border-amber-500/30 bg-amber-500/10">
            <CardContent className="space-y-3 p-4">
              <div className="text-sm text-amber-200">{error}</div>
              {error.includes('Admin') && (
                <div className="flex gap-2">
                  <Input
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                    placeholder="ADMIN_BOOTSTRAP_TOKEN"
                    className="border-slate-700 bg-slate-950"
                  />
                  <Button onClick={bootstrap}><Trans text="Grant admin" /></Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button onClick={load} disabled={loading} variant="outline" className="border-slate-700 bg-slate-900">
            <RefreshCw className="mr-2 h-4 w-4" />
            <Trans text="Refresh" />
          </Button>
        </div>

        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-cyan-400" /><Trans text="Users" /></CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="p-2">Email</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Plan</th>
                  <th className="p-2">Days</th>
                  <th className="p-2">Usage</th>
                  <th className="p-2">Mood</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-800">
                    <td className="p-2">{user.email || user.id}</td>
                    <td className="p-2">
                      <Badge className={user.online ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-400'}>
                        {user.online ? 'Online' : 'Offline'}
                      </Badge>
                    </td>
                    <td className="p-2">{user.role}</td>
                    <td className="p-2">{user.subscription?.plan || 'free'}</td>
                    <td className="p-2">{user.days_left ?? '-'}</td>
                    <td className="p-2">{user.usage_today?.ai_analysis_count ?? 0}</td>
                    <td className="p-2">{user.satisfaction || '-'}</td>
                    <td className="flex flex-wrap gap-2 p-2">
                      <Button size="sm" variant="outline" onClick={() => setUserRole(user.id, user.role === 'admin' ? 'user' : 'admin').then(load)}>
                        {user.role === 'admin' ? 'Remove admin' : 'Make admin'}
                      </Button>
                      <Select onValueChange={(value) => setUserSubscription(user.id, value as 'free' | 'pro' | 'trader', 30).then(load)}>
                        <SelectTrigger className="h-8 w-28 border-slate-700 bg-slate-950"><SelectValue placeholder="Plan" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="trader">Trader</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-cyan-400" /><Trans text="Contact messages" /></CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="rounded-md border border-slate-800 bg-slate-950 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{message.subject}</div>
                    <div className="text-xs text-slate-500">{message.email || message.name || 'anonymous'} - {new Date(message.created_at).toLocaleString()}</div>
                  </div>
                  <Select value={message.status} onValueChange={(value) => setMessageStatus(message.id, value as 'new' | 'read' | 'closed').then(load)}>
                    <SelectTrigger className="h-8 w-28 border-slate-700 bg-slate-900"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="mt-2 text-sm text-slate-300">{message.message}</p>
                <div className="mt-2 text-xs text-slate-500">Mood: {message.satisfaction || '-'}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};

export default Admin;
