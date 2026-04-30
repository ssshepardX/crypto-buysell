import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CandlestickChart,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Waves,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import RealMarketChart from '@/components/RealMarketChart';
import { getTop200CoinsByVolume, CoinData } from '@/services/binanceService';
import {
  AnalysisTimeframe,
  CoinAnalysisError,
  CoinAnalysis as CoinAnalysisData,
  analyzeCoin,
} from '@/services/coinAnalysisService';
import {
  getCurrentSubscription,
  getTodayUsage,
  PLAN_ENTITLEMENTS,
  UserSubscription,
  UserUsageDaily,
} from '@/services/subscriptionService';

const TIMEFRAMES: AnalysisTimeframe[] = ['5m', '15m', '30m', '1h', '4h'];

const scoreColor = (score: number) => {
  if (score >= 75) return 'text-rose-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-emerald-400';
};

const formatUsd = (value: number) => (
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value > 10 ? 2 : 6,
  })
);

const CoinAnalysis = () => {
  const { symbol: routeSymbol } = useParams();
  const [symbol, setSymbol] = useState((routeSymbol || 'BTCUSDT').toUpperCase());
  const [timeframe, setTimeframe] = useState<AnalysisTimeframe>('15m');
  const [analysis, setAnalysis] = useState<CoinAnalysisData | null>(null);
  const [marketCoins, setMarketCoins] = useState<CoinData[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UserUsageDaily | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCurrentSubscription(), getTodayUsage()]).then(([sub, today]) => {
      if (cancelled) return;
      setSubscription(sub);
      setUsage(today);
    });
    getTop200CoinsByVolume().then((coins) => {
      if (cancelled) return;
      const ranked = coins
        .filter((coin) => coin.symbol.endsWith('USDT'))
        .sort((a, b) => {
          const aScore = Math.abs(a.priceChangePercent) * 0.65 + Math.log10(Math.max(a.quoteVolume, 1)) * 0.35;
          const bScore = Math.abs(b.priceChangePercent) * 0.65 + Math.log10(Math.max(b.quoteVolume, 1)) * 0.35;
          return bScore - aScore;
        })
        .slice(0, 12);
      setMarketCoins(ranked);
      if (!routeSymbol && ranked[0]?.symbol) setSymbol(ranked[0].symbol);
    });
    return () => {
      cancelled = true;
    };
  }, [routeSymbol]);

  const runAnalysis = async (force = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeCoin(symbol, timeframe, force);
      setAnalysis(result);
      const today = await getTodayUsage();
      setUsage(today);
    } catch (err) {
      if (err instanceof CoinAnalysisError && err.code === 'AI_LIMIT_REACHED') {
        setError(`Gunluk AI analiz limitin doldu (${err.used}/${err.limit}). Devam etmek icin plani yukselt.`);
      } else {
        setError(err instanceof Error ? err.message : 'Analiz calistirilamadi');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const aiSummary = analysis?.ai_summary_json;
  const risk = analysis?.risk_json;
  const indicators = analysis?.indicator_json;
  const entitlement = PLAN_ENTITLEMENTS[subscription?.plan || 'free'];

  return (
    <AppShell
      title="Coin Analiz Terminali"
      subtitle="Canli chart, teknik onay, whale izi ve hareket kaynagi degerlendirmesi"
      action={<Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300">AI Supervisor</Badge>}
    >
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <section className="space-y-4">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CandlestickChart className="h-4 w-4 text-cyan-400" />
                Analiz Secimi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Parite</label>
                <Input
                  value={symbol}
                  onChange={(event) => setSymbol(event.target.value.toUpperCase())}
                  className="border-slate-700 bg-slate-950 font-mono"
                />
                <div className="flex flex-wrap gap-2">
                  {marketCoins.map((coin) => (
                    <Button
                      key={coin.symbol}
                      type="button"
                      size="sm"
                      variant={symbol === coin.symbol ? 'default' : 'outline'}
                      onClick={() => setSymbol(coin.symbol)}
                      className="h-7 px-2 text-xs"
                      title={`${coin.priceChangePercent.toFixed(2)}% / Vol ${Math.round(coin.quoteVolume).toLocaleString('en-US')}`}
                    >
                      {coin.symbol.replace('USDT', '')}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400">Zaman araligi</label>
                <div className="grid grid-cols-5 gap-2">
                  {TIMEFRAMES.map((item) => (
                    <Button
                      key={item}
                      type="button"
                      size="sm"
                      variant={timeframe === item ? 'default' : 'outline'}
                      onClick={() => setTimeframe(item)}
                      className="h-8 px-0"
                    >
                      {item}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => runAnalysis(false)} disabled={isLoading}>
                  <Brain className="mr-2 h-4 w-4" />
                  Degerlendir
                </Button>
                <Button onClick={() => runAnalysis(true)} disabled={isLoading} variant="outline">
                  <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
                  Tazele
                </Button>
              </div>

              {error && (
                <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {analysis && (
            <Card className="border-slate-800 bg-slate-900">
              <CardHeader>
                <CardTitle className="text-base">{analysis.symbol} / {analysis.timeframe}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold">{formatUsd(Number(analysis.price))}</div>
                <div className="rounded-md border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
                  Plan: <span className="text-slate-200">{subscription?.plan.toUpperCase() || 'FREE'}</span> - AI kullanim: {usage?.ai_analysis_count || 0}/{entitlement.aiDailyLimit}
                </div>
                <div className="flex flex-wrap gap-2">
                  {risk?.labels.map((label) => (
                    <Badge key={label} variant="outline" className="border-slate-700 text-slate-300">
                      {label}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  {analysis.cache_hit ? 'Cache kullanildi' : analysis.ai_cache_hit ? 'AI cache kullanildi' : 'Yeni analiz olusturuldu'} - {new Date(analysis.created_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        <section className="space-y-4">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-cyan-400" />
                Piyasa Chart
              </CardTitle>
              {aiSummary && (
                <Badge className="bg-slate-800 text-slate-200">
                  Kaynak: {analysis?.cause_json?.likely_cause || aiSummary.likely_cause || 'balanced_market'}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="h-[360px] rounded-lg border border-slate-800 bg-slate-950 p-3">
                <RealMarketChart symbol={symbol} timeframe={timeframe} analysis={analysis} />
              </div>
            </CardContent>
          </Card>

          {analysis && risk && indicators && aiSummary && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <MetricCard icon={TrendingUp} label="Hareket Sebebi" value={analysis.cause_json?.movement_cause_score.technical_breakout ?? risk.trend_score} />
                <MetricCard icon={Activity} label="Güven Skoru" value={analysis.cause_json?.confidence_score ?? 0} />
                <MetricCard icon={ShieldAlert} label="Manipülasyon Riski" value={analysis.cause_json?.early_warning_score ?? risk.pump_dump_risk_score} danger />
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Card className="border-slate-800 bg-slate-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      Risk ve Whale Kontrolu
                    </CardTitle>
                  </CardHeader>
                  {entitlement.canViewAdvancedRisk ? (
                    <CardContent className="grid grid-cols-2 gap-3 text-sm">
                      <InfoLine label="Whale Risk" value={`${risk.whale_risk_score}/100`} />
                      <InfoLine label="Buy Pressure" value={`${analysis.market_microstructure_json?.trades.buyPressurePct ?? 0}%`} />
                      <InfoLine label="Large Trades" value={String(analysis.market_microstructure_json?.trades.largeTradeCount ?? 0)} />
                      <InfoLine label="Reversal Risk" value={`${risk.reversal_risk_score}/100`} />
                      <InfoLine label="Volume Confirm" value={`${risk.volume_confirmation_score}/100`} />
                      <InfoLine label="Spread" value={`${risk.orderbook.spreadPct}%`} />
                      <InfoLine label="Orderbook" value={risk.orderbook.isThin ? 'Thin' : 'Normal'} />
                      <InfoLine label="Bid/Ask Imbalance" value={`${risk.orderbook.imbalancePct}%`} />
                    </CardContent>
                  ) : (
                    <CardContent>
                      <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                        Advanced risk ve whale paneli Pro/Trader planlarinda aciktir.
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="border-slate-800 bg-slate-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Waves className="h-4 w-4 text-cyan-400" />
                      Teknik Ozet
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 text-sm">
                    <InfoLine label="RSI 14" value={String(indicators.rsi14)} />
                    <InfoLine label="MACD Hist" value={String(indicators.macdHistogram)} />
                    <InfoLine label="ATR %" value={`${indicators.atrPct}%`} />
                    <InfoLine label="Volume Z" value={String(indicators.volumeZScore)} />
                    <InfoLine label="Candle Expansion" value={`${indicators.candleExpansion}x`} />
                    <InfoLine label="Support" value={formatUsd(indicators.support)} />
                    <InfoLine label="Resistance" value={formatUsd(indicators.resistance)} />
                  </CardContent>
                </Card>
              </div>

              <Card className="border-slate-800 bg-slate-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-cyan-400" />
                    Hareket Sebebi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-md border border-slate-800 bg-slate-950 p-4">
                    <div className="text-xs text-slate-500">Likely Cause</div>
                    <div className="mt-1 text-xl font-semibold text-slate-100">{analysis.cause_json?.likely_cause || aiSummary.likely_cause || 'balanced_market'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
                    <InfoLine label="Organic" value={`${analysis.cause_json?.movement_cause_score.organic ?? 0}/100`} />
                    <InfoLine label="Whale" value={`${analysis.cause_json?.movement_cause_score.whale ?? 0}/100`} />
                    <InfoLine label="Fraud/Pump" value={`${analysis.cause_json?.movement_cause_score.fraud_pump ?? 0}/100`} />
                    <InfoLine label="News/Social" value={`${analysis.cause_json?.movement_cause_score.news_social ?? 0}/100`} />
                    <InfoLine label="Low Liquidity" value={`${analysis.cause_json?.movement_cause_score.low_liquidity ?? 0}/100`} />
                    <InfoLine label="Teknik Onay" value={`${analysis.cause_json?.movement_cause_score.technical_breakout ?? 0}/100`} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Waves className="h-4 w-4 text-emerald-400" />
                    News / Social Katalizör
                  </CardTitle>
                </CardHeader>
                {entitlement.canViewAdvancedRisk ? (
                  <CardContent className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                    <InfoLine label="News Sources" value={String(analysis.news_json?.source_count ?? 0)} />
                    <InfoLine label="News Confidence" value={`${analysis.news_json?.confidence ?? 0}/100`} />
                    <InfoLine label="Reddit Mentions" value={String(analysis.social_json?.mention_delta ?? 0)} />
                    <InfoLine label="Social Confidence" value={`${analysis.social_json?.confidence ?? 0}/100`} />
                    <div className="col-span-2 rounded-md border border-slate-800 bg-slate-950 p-3 md:col-span-4">
                      <div className="text-xs text-slate-500">Catalyst Terms</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {[...(analysis.news_json?.top_catalyst_terms || []), ...(analysis.social_json?.top_catalyst_terms || [])].slice(0, 8).map((term) => (
                          <Badge key={term} variant="outline" className="border-slate-700 text-slate-300">{term}</Badge>
                        ))}
                        {!(analysis.news_json?.top_catalyst_terms?.length || analysis.social_json?.top_catalyst_terms?.length) && (
                          <span className="text-sm text-slate-500">Katalizör terim bulunamadi veya provider konfigure degil.</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                ) : (
                  <CardContent>
                    <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                      News/social source breakdown Pro/Trader planlarinda aciktir.
                    </div>
                  </CardContent>
                )}
              </Card>

              <Card className="border-cyan-500/20 bg-cyan-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Brain className="h-4 w-4 text-cyan-300" />
                    AI Supervisor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-lg leading-relaxed text-slate-100">{aiSummary.catalyst_summary_tr || aiSummary.summary_tr}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={cn('bg-slate-800', scoreColor(aiSummary.whale_probability ?? analysis.cause_json?.movement_cause_score.whale ?? 0))}>
                      Whale izi: {aiSummary.whale_probability ?? analysis.cause_json?.movement_cause_score.whale ?? 0}%
                    </Badge>
                    <Badge className="bg-slate-800">Manipülasyon: {aiSummary.manipulation_risk || aiSummary.risk_level}</Badge>
                    <Badge className="bg-slate-800">Güven: {aiSummary.confidence ?? analysis.cause_json?.confidence_score ?? 0}/100</Badge>
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    {aiSummary.watch_points.map((point) => (
                      <div key={point} className="rounded-md border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
                        {point}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">{aiSummary.not_advice_notice}</p>
                </CardContent>
              </Card>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
};

const MetricCard = ({
  icon: Icon,
  label,
  value,
  danger = false,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  danger?: boolean;
}) => (
  <Card className="border-slate-800 bg-slate-900">
    <CardContent className="flex items-center justify-between p-5">
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className={cn('text-3xl font-bold', danger ? scoreColor(value) : 'text-cyan-300')}>{value}</p>
      </div>
      <Icon className="h-8 w-8 text-slate-600" />
    </CardContent>
  </Card>
);

const InfoLine = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
    <div className="text-xs text-slate-500">{label}</div>
    <div className="font-mono text-slate-200">{value}</div>
  </div>
);

export default CoinAnalysis;
