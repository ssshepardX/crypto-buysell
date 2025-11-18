// Ultra-Dark AI Market Analyst Dashboard with Glassmorphism

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  TrendingUp,
  Zap,
  Shield,
  Brain,
  Eye,
  BarChart3,
  Settings,
  Bell,
  AlertTriangle,
  Timer,
  Users
} from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useGenerateSignals } from '@/hooks/useGenerateSignals';
import { PumpAlerts } from '@/components/PumpAlerts';
import { supabase } from '@/integrations/supabase/client';

// Mock data for demonstration - replace with real data later
const mockAlerts = [
  {
    id: '1',
    symbol: 'BTCUSDT',
    price: 45000,
    priceChange: 2.5,
    volumeMultiplier: 3.2,
    riskScore: 85,
    aiSummary: 'Critical high volume spike detected on thin order book. AI analysis indicates potential manipulative pump & dump activity in early stages.',
    likelySource: 'Coordinated Pump Group',
    actionableInsight: 'Immediate exit position. Monitor for reversal signals.',
    detectedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    orderbookDepth: 1250000
  },
  {
    id: '2',
    symbol: 'XRPUSDT',
    price: 0.42,
    priceChange: 1.8,
    volumeMultiplier: 2.1,
    riskScore: 45,
    aiSummary: 'Moderate volume increase with strong buy pressure. Potentially organic growth momentum building.',
    likelySource: 'Accumulation Phase',
    actionableInsight: 'Consider entry with tight stop loss. Monitor volume sustainability.',
    detectedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    orderbookDepth: 2100000
  },
  {
    id: '3',
    symbol: 'ETHUSDT',
    price: 2850,
    priceChange: 0.8,
    volumeMultiplier: 1.9,
    riskScore: 25,
    aiSummary: 'Low risk. Steady accumulation detected with balanced order book depth.',
    likelySource: 'Organic Trading',
    actionableInsight: 'Safe to continue monitoring. No immediate action required.',
    detectedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    orderbookDepth: 23000000
  }
];

const DashboardPage = () => {
  const { session, loading } = useSession();
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState({
    watcherActive: true,
    aiWorkerActive: true,
    pendingJobs: 0,
    alertsToday: 47
  });

  // Market watcher hook - enables dark mode background
  const { isGenerating, progress, lastGenerated, generateSignals } = useGenerateSignals({
    maxCoins: 20,
    aiEnabled: true,
    autoScan: true
  });

  // Ultra-dark theme background effect
  useEffect(() => {
    document.body.className = 'dark';
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIj48Y2lyY2xlIHI9IjEiIGN5PSIyIiBmaWxsPSIjNmI3MjgwIiAvPjpwYXR0ZXJuPjxkZWZzPjxzLmc+PGNpcmNsZSByPSIyIiBjeD0iMTAiIGN5PSIxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMjd1cTgxNCIgc3Ryb2tlLW9wYWNpdHk9IjAuNCIvPg==')] opacity-30" />

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Glass navbar placeholder */}
          <div className="sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-sky-500 rounded-lg flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <span className="text-white font-['Inter'] font-semibold">AI Market Analyst</span>
              </div>
              <div className="w-32 h-8 bg-slate-800/50 rounded-lg animate-pulse" />
            </div>
          </div>

          <main className="flex-grow container mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="h-12 bg-slate-800/50 rounded-xl mb-8 max-w-md"></div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 bg-slate-800/50 rounded-xl"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-48 bg-slate-800/50 rounded-xl"></div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950">
      {/* Background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-slate-950"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)] animate-pulse"></div>
        </div>
      </div>

      {/* Glass Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-xl border-b border-white/10 shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-sky-600 rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-slate-200 font-inter font-semibold text-lg">
                AI Market Analyst
              </h1>
              <p className="text-slate-400 font-jetbrains text-xs">
                Crypto pump & dump detection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* System Status */}
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm rounded-lg px-3 py-1">
                <div className={`w-2 h-2 rounded-full ${systemStatus.watcherActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                <span className="text-xs text-slate-300 font-jetbrains">Market Watcher</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm rounded-lg px-3 py-1">
                <div className={`w-2 h-2 rounded-full ${systemStatus.aiWorkerActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                <span className="text-xs text-slate-300 font-jetbrains">AI Worker</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-slate-400 cursor-pointer hover:text-cyan-400 transition-colors" />
              <Bell className="h-5 w-5 text-slate-400 cursor-pointer hover:text-cyan-400 transition-colors" />
</div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        {/* Welcome Section */}
        <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-inter font-semibold text-slate-200 mb-2">
                Welcome back, {session?.user?.email?.split('@')[0]}
              </h2>
              <p className="text-slate-400 font-inter">
                Your AI-powered market surveillance system is actively monitoring real-time anomalies
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              <span className="text-cyan-400 font-jetbrains font-medium">
                AI Systems Active
              </span>
            </div>
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-950/50 backdrop-blur-md border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-rose-400" />
                </div>
                <div>
                  <p className="text-2xl font-jetbrains font-bold text-rose-400">
                    {systemStatus.alertsToday}
                  </p>
                  <p className="text-xs text-slate-400">Critical Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-950/50 backdrop-blur-md border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  <Brain className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-jetbrains font-bold text-cyan-400">
                    {systemStatus.pendingJobs}
                  </p>
                  <p className="text-xs text-slate-400">AI Queue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-950/50 backdrop-blur-md border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Activity className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-jetbrains font-bold text-emerald-400">
                    {isGenerating ? 'Active' : 'Scanning'}
                  </p>
                  <p className="text-xs text-slate-400">Market Status</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-950/50 backdrop-blur-md border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Timer className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-jetbrains font-bold text-yellow-400">
                    60s
                  </p>
                  <p className="text-xs text-slate-400">Scan Interval</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-inter font-semibold text-slate-200">
                Market Surveillance Control
              </h3>
              <p className="text-sm text-slate-400">
                Monitor top 200 cryptocurrencies for pump & dump patterns
              </p>
            </div>
            <Button
              onClick={generateSignals}
              disabled={isGenerating}
              className="bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white font-inter font-medium px-6 py-2 rounded-lg"
            >
              <Eye className="h-4 w-4 mr-2" />
              {isGenerating ? 'Monitoring...' : 'Start New Scan'}
            </Button>
          </div>

          {isGenerating && (
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300 font-inter">
                  Scanning Progress
                </span>
                <span className="text-sm text-cyan-400 font-jetbrains">
                  {progress.current}/{progress.total}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-sky-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Last scan: {lastGenerated ? lastGenerated.toLocaleTimeString() : 'Never'}
              </p>
            </div>
          )}
        </div>

        {/* Active AI Alerts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-inter font-semibold text-slate-200">
              Active AI Alerts
            </h3>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-400 font-jetbrains">
                Monitoring 200+ coins in real-time
              </span>
            </div>
          </div>

          <PumpAlerts alerts={[]} isLoading={false} />

          {mockAlerts.length === 0 && (
            <div className="text-center py-12 bg-slate-950/50 backdrop-blur-md border border-white/10 rounded-xl">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-slate-600" />
              <h4 className="text-lg font-inter font-medium text-slate-400 mb-2">
                No Active Alerts
              </h4>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Your AI surveillance system is actively monitoring for anomalies.
                All clear at the moment.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
