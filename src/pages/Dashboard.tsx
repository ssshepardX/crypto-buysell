import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Brain, Clock, ExternalLink, Flame, ShieldAlert, Zap } from 'lucide-react';
import AppShell from '@/components/AppShell';
import ScanningCard from '@/components/ScanningCard';
import { CoinAnalysis, getRecentAnalyses } from '@/services/coinAnalysisService';
import {
  getCurrentSubscription,
  getTodayUsage,
  PLAN_ENTITLEMENTS,
  UserSubscription,
  UserUsageDaily,
} from '@/services/subscriptionService';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trans } from '@/contexts/LanguageContext';
import { getMarketSentiment, SentimentError, SentimentResult } from '@/services/sentimentService';
import { cn } from '@/lib/utils';

const starterPairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT'];

const DashboardPage = () => {
  const { session, loading } = useSession();
  const [recentAnalyses, setRecentAnalyses] = useState<CoinAnalysis[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UserUsageDaily | null>(null);
  const [sentimentTrends, setSentimentTrends] = useState<SentimentResult[]>([]);
  const [sentimentSummary, setSentimentSummary] = useState<{ most_mentioned: string | null; news_mood: number; reddit_heat: number; asia_watch: number } | null>(null);
  const [sentimentLocked, setSentimentLocked] = useState(false);
  const [sentimentError, setSentimentError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(true);
  const [lastSentimentAt, setLastSentimentAt] = useState<string | null>(null);

  const entitlement = useMemo(
    () => PLAN_ENTITLEMENTS[subscription?.plan || 'free'],
    [subscription?.plan]
  );
  const meaningfulAnalyses = useMemo(
    () => recentAnalyses.filter((analysis) =>
      Boolean(analysis.cause_json?.likely_cause) &&
      Number(analysis.cause_json?.confidence_score || 0) > 0 &&
      Boolean(analysis.risk_json)
    ),
    [recentAnalyses]
  );
  const latestAnalysisAt = meaningfulAnalyses[0]?.created_at || null;
  const hotNewsItems = useMemo(() => {
    const seen = new Set<string>();
    return sentimentTrends
      .flatMap((trend) =>
        trend.source_json.items.map((item) => ({
          ...item,
          symbol: trend.symbol,
          sentimentLabel: trend.score_json.sentiment_label,
          sentimentScore: trend.score_json.sentiment_score,
        }))
      )
      .filter((item) => item.url && item.title)
      .filter((item) => {
        const key = item.url || item.title || '';
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime();
      })
      .slice(0, 6);
  }, [sentimentTrends]);

  const loadMarketData = useCallback(async () => {
    try {
      const analyses = await getRecentAnalyses();
      setRecentAnalyses(analyses);
    } catch {
      setRecentAnalyses([]);
    }
  }, []);

  const loadSentiment = useCallback(async (plan: string) => {
    setSentimentError(null);
    if (plan === 'free') {
      setSentimentLocked(true);
      setSentimentTrends([]);
      return;
    }
    setSentimentLoading(true);
    try {
      const data = await getMarketSentiment(12);
      setSentimentTrends(data.trends);
      setSentimentSummary(data.summary);
      setLastSentimentAt(data.created_at || new Date().toISOString());
      setSentimentLocked(false);
    } catch (err) {
      if (err instanceof SentimentError && err.code === 'SENTIMENT_REQUIRES_PRO') {
        setSentimentLocked(true);
        setSentimentTrends([]);
        return;
      }
      setSentimentLocked(false);
      setSentimentTrends([]);
      setSentimentError(err instanceof Error ? err.message : 'Trend intelligence could not be loaded.');
    } finally {
      setSentimentLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setPlanLoading(true);
    try {
      const [sub, today] = await Promise.all([getCurrentSubscription(), getTodayUsage()]);
      setSubscription(sub);
      setUsage(today);
      setPlanLoading(false);
      await loadMarketData();
      await loadSentiment(sub.plan);
    } finally {
      setIsLoading(false);
      setPlanLoading(false);
    }
  }, [loadMarketData, loadSentiment]);

  useEffect(() => {
    document.body.className = 'dark';
    loadDashboard();
    const interval = window.setInterval(() => {
      loadMarketData();
      if (subscription?.plan && subscription.plan !== 'free') loadSentiment(subscription.plan);
    }, 60000);
    return () => window.clearInterval(interval);
  }, [loadDashboard, loadMarketData, loadSentiment, subscription?.plan]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
        <div className="mx-auto max-w-7xl animate-pulse space-y-4">
          <div className="h-16 rounded-md bg-slate-900" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 rounded-md bg-slate-900" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      title={`Dashboard${session?.user?.email ? ` - ${session.user.email.split('@')[0]}` : ''}`}
      subtitle="See account limits and recent movement checks."
      action={null}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={ShieldAlert} label="Plan" value={subscription?.plan.toUpperCase() || 'FREE'} loading={planLoading && !subscription} />
        <MetricCard icon={Brain} label="Daily checks" value={`${usage?.ai_analysis_count || 0}/${entitlement.aiDailyLimit}`} />
        <MetricCard icon={Activity} label="Scanner" value={entitlement.canRunScanner ? 'Enabled' : `${entitlement.scannerDelayMinutes} min delay`} loading={planLoading && !subscription} />
        <MetricCard icon={Clock} label="Renewal" value={subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString('tr-TR') : '-'} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={Flame} label="Most Mentioned" value={sentimentLocked ? 'PRO' : sentimentSummary?.most_mentioned?.replace('USDT', '') || '-'} />
        <MetricCard icon={Activity} label="News Mood" value={sentimentLocked ? 'Locked' : `${sentimentSummary?.news_mood ?? 0}/100`} />
        <MetricCard icon={Zap} label="Reddit Heat" value={sentimentLocked ? 'Locked' : `${sentimentSummary?.reddit_heat ?? 0}/100`} />
        <MetricCard icon={Clock} label="Asia Watch" value={sentimentLocked ? 'Locked' : `${sentimentSummary?.asia_watch ?? 0}/100`} />
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base"><Trans text="Trend Intelligence" /></CardTitle>
            <p className="mt-1 text-sm text-slate-400"><Trans text="Highest-value cached RSS items from the last automated sweep." /></p>
            <p className="mt-2 text-xs text-slate-500">
              {lastSentimentAt ? `Auto sweep ${new Date(lastSentimentAt).toLocaleTimeString('tr-TR')}` : 'Waiting for RSS cache'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn('bg-slate-800', sentimentLocked ? 'text-amber-200' : 'text-cyan-200')}>
              {sentimentLocked ? 'Pro+' : 'Auto RSS'}
            </Badge>
            {sentimentLocked && <Button asChild className="bg-cyan-500 hover:bg-cyan-600"><Link to="/pricing">Upgrade</Link></Button>}
          </div>
        </CardHeader>
        <CardContent>
          {sentimentLoading && !hotNewsItems.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-md border border-slate-800 bg-slate-950" />
              ))}
            </div>
          ) : sentimentLocked ? (
            <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
              <Trans text="Trend sentiment is available on Pro and Trader plans." />
            </div>
          ) : hotNewsItems.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {hotNewsItems.map((item) => {
                return (
                <div key={`${item.symbol}-${item.url}`} className="rounded-md border border-slate-800 bg-slate-950 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <Link to={`/analysis/${item.symbol}`} className="font-semibold text-slate-100 hover:text-cyan-300">{item.symbol.replace('USDT', '')}</Link>
                    <div className="flex items-center gap-2">
                      <SentimentBadge label={item.sentimentLabel} score={item.sentimentScore} />
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-1 text-sm font-medium text-slate-200">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-400">{item.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Badge className="bg-slate-800 text-slate-300">{item.domain || 'RSS source'}</Badge>
                    <Badge className="bg-slate-800 text-slate-300">Impact {item.score}/100</Badge>
                    {item.published_at && <Badge className="bg-slate-800 text-slate-300">{new Date(item.published_at).toLocaleDateString('tr-TR')}</Badge>}
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs">
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200">
                        Read source <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <Link to={`/analysis/${item.symbol}`} className="text-slate-400 hover:text-slate-200">Open analysis</Link>
                  </div>
                </div>
              );})}
            </div>
          ) : (
            <div className="rounded-md border border-slate-800 bg-slate-950 p-5">
              <div className="text-sm font-medium text-slate-200">No verified news catalyst in latest auto sweep</div>
              <p className="mt-1 text-sm text-slate-400">
                {sentimentError || 'RSS cache has no high-value coin-linked item yet. No placeholder cards.'}
              </p>
              <span className="mt-4 inline-block text-xs text-slate-500">Auto refresh every 15m. Verified RSS only.</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base"><Trans text="Movement scanner" /></CardTitle>
            <p className="mt-1 text-sm text-slate-400">
              <Trans text="Cron-fed anomaly cache. Shows only recent high-signal movement candidates." />
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {latestAnalysisAt ? `Auto scan ${new Date(latestAnalysisAt).toLocaleTimeString('tr-TR')}` : 'Waiting for anomaly cache'}
            </p>
          </div>
          <Badge className="bg-slate-800 text-cyan-200">Auto anomaly watch</Badge>
        </CardHeader>
        <CardContent>
          {isLoading && !meaningfulAnalyses.length ? (
            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-md border border-slate-800 bg-slate-950" />
              ))}
            </div>
          ) : meaningfulAnalyses.length ? (
            <div className="grid gap-3 md:grid-cols-3">
              {meaningfulAnalyses.slice(0, 3).map((analysis) => (
                <Link key={analysis.id} to={`/analysis/${analysis.symbol}`} className="rounded-md border border-slate-800 bg-slate-950 p-3 transition hover:border-cyan-500/40">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100">{analysis.symbol.replace('USDT', '')}</span>
                    <Badge className="bg-slate-800 text-cyan-200">{analysis.cause_json?.confidence_score || 0}/100</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{causeLabel(analysis.cause_json?.likely_cause)}</p>
                  <p className="mt-1 text-xs text-slate-500">Risk {analysis.risk_json?.pump_dump_risk_score || 0}/100</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
              No anomaly crossed scanner threshold yet. Cron keeps sampling top pairs every 15m.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base"><Trans text="Market lab" /></CardTitle>
            <p className="mt-1 text-sm text-slate-400"><Trans text="Open a pair and inspect the likely cause behind its move." /></p>
          </div>
          <Button asChild className="bg-cyan-500 hover:bg-cyan-600">
            <Link to="/analysis">
              <BarChart3 className="mr-2 h-4 w-4" />
              <Trans text="Open" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
            {starterPairs.map((symbol) => (
              <Button key={symbol} asChild variant="outline" className="border-slate-700 bg-slate-950">
                <Link to={`/analysis/${symbol}`}>{symbol.replace('USDT', '')}</Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {meaningfulAnalyses.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100"><Trans text="Recent movement checks" /></h2>
            <Badge className="bg-slate-800 text-slate-300">Cause cache</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {meaningfulAnalyses.slice(0, 6).map((analysis) => (
              <Link key={analysis.id} to={`/analysis/${analysis.symbol}`}>
                <ScanningCard
                  realData={{
                    symbol: analysis.symbol,
                    time: analysis.created_at,
                    risk_score: analysis.risk_json.pump_dump_risk_score,
                    price_change: analysis.risk_json.trend_score,
                    volume_spike: Math.max(0, analysis.indicator_json.volumeZScore),
                    summary: analysis.ai_summary_json.catalyst_summary_tr || analysis.ai_summary_json.summary_tr || 'Hareket kaynagi siniflandirildi',
                    likely_cause: analysis.cause_json?.likely_cause,
                    confidence: analysis.cause_json?.confidence_score,
                    early_warning: analysis.cause_json?.early_warning_score,
                    ai_source: analysis.ai_summary_json.source,
                    ai_fallback_reason: analysis.ai_summary_json.fallback_reason,
                  }}
                />
              </Link>
            ))}
          </div>
        </section>
      )}

    </AppShell>
  );
};

const MetricCard = ({ icon: Icon, label, value, loading = false }: { icon: React.ElementType; label: string; value: string; loading?: boolean }) => (
  <Card className="border-slate-800 bg-slate-900">
    <CardContent className="flex items-center justify-between p-4">
      <div>
        <p className="text-xs text-slate-500"><Trans text={label} /></p>
        {loading ? (
          <div className="mt-2 h-7 w-24 animate-pulse rounded bg-slate-800" />
        ) : (
          <p className="mt-1 text-xl font-semibold text-slate-100">{value}</p>
        )}
      </div>
      <Icon className="h-6 w-6 text-cyan-400" />
    </CardContent>
  </Card>
);

const TrendIcon = ({ direction }: { direction: 'up' | 'down' | 'flat' }) => {
  if (direction === 'up') return <ArrowUpRight className="h-4 w-4 text-emerald-400" />;
  if (direction === 'down') return <ArrowDownRight className="h-4 w-4 text-rose-400" />;
  return <ArrowRight className="h-4 w-4 text-slate-400" />;
};

const SentimentBadge = ({ label, score }: { label: string; score: number }) => (
  <Badge className={cn(
    'bg-slate-800',
    label === 'good' && 'text-emerald-300',
    label === 'bad' && 'text-rose-300',
    label === 'neutral' && 'text-slate-300'
  )}>
    {label} {score}/100
  </Badge>
);

const causeLabel = (cause?: string) => {
  const labels: Record<string, string> = {
    organic_demand: 'Organic demand',
    whale_push: 'Whale push',
    thin_liquidity_move: 'Thin liquidity move',
    fomo_trap: 'FOMO trap',
    fraud_pump_risk: 'Manipulation risk',
    news_social_catalyst: 'News/social catalyst',
    balanced_market: 'Balanced market',
  };
  return labels[cause || ''] || 'Movement classified';
};

export default DashboardPage;
