import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { calculateCause, calculateIndicators, calculateRisk, fetchKlines, normalizeSymbol, normalizeTimeframe, round, type IndicatorSummary, type Kline, type Timeframe } from "../_shared/analysis-engine.ts";
import { json, requireAdmin, serviceClient } from "../_shared/admin-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const flatOrderbook = { bidDepthUsd: 2_000_000, askDepthUsd: 2_000_000, spreadPct: 0.02, imbalancePct: 0, isThin: false };
const flatTrades = { largeTradeCount: 0, largeTradeUsd: 0, largestTradeUsd: 0, buyPressurePct: 50, sellPressurePct: 50 };
const MANIPULATION_LABELS = ["whale_push", "fraud_pump_risk", "thin_liquidity_move", "fomo_trap"];

type EventRow = {
  id?: string;
  symbol: string;
  timeframe: Timeframe | string;
  event_start: string;
  event_end: string | null;
  move_pct: number;
  volume_zscore: number;
  detected_label: string;
  realized_outcome: string;
  confidence_score: number;
  details_json?: Record<string, unknown>;
};

function thresholdFor(timeframe: Timeframe) {
  if (timeframe === "5m") return 0.55;
  if (timeframe === "15m") return 0.75;
  if (timeframe === "30m") return 1.05;
  return 1.7;
}

function lookaheadBars(timeframe: Timeframe) {
  if (timeframe === "5m") return 24;
  if (timeframe === "15m") return 12;
  if (timeframe === "30m") return 8;
  return 6;
}

function lookaheadWindows(timeframe: Timeframe) {
  if (timeframe === "5m") return [6, 12, 24];
  if (timeframe === "15m") return [2, 4, 8];
  if (timeframe === "30m") return [1, 2, 4];
  return [1, 2, 3];
}

function outcome(klines: Kline[], index: number, movePct: number, timeframe: Timeframe, indicators: IndicatorSummary) {
  const start = klines[index];
  const future = klines.slice(index + 1, index + 1 + lookaheadBars(timeframe));
  if (!future.length) return "unknown";
  const direction = movePct >= 0 ? 1 : -1;
  const maxMove = Math.max(...future.map((k) => direction > 0 ? (k.high - start.close) / start.close * 100 : (start.close - k.low) / start.close * 100));
  const endMove = (future.at(-1)!.close - start.close) / start.close * 100 * direction;
  const windowMoves = lookaheadWindows(timeframe)
    .map((bars) => future[Math.min(bars - 1, future.length - 1)])
    .filter(Boolean)
    .map((bar) => (bar.close - start.close) / start.close * 100 * direction);
  const bestWindowMove = Math.max(...windowMoves, endMove);
  const nextBarMove = future[0] ? (future[0].close - start.close) / start.close * 100 * direction : 0;
  const wickTrap = direction > 0 ? indicators.upperWickPct > 42 : indicators.lowerWickPct > 42;
  if (wickTrap && nextBarMove < -Math.abs(movePct) * 0.18) return "wick_trap";
  if (bestWindowMove > Math.abs(movePct) * 0.3 || maxMove > Math.abs(movePct) * 0.72) return "continued";
  if (endMove < -Math.abs(movePct) * 0.3) return "reversed";
  return "low_signal";
}

function historicalLabel(
  rawLabel: string,
  realizedOutcome: string,
  indicators: IndicatorSummary,
  movePct: number,
) {
  const strongRejection = Math.max(indicators.upperWickPct, indicators.lowerWickPct) > 42;
  const abnormal = indicators.volumeZScore >= 2.4 && indicators.candleExpansion >= 1.8;
  if (realizedOutcome === "wick_trap" && abnormal && strongRejection) return "fomo_trap";
  if (realizedOutcome === "reversed" && abnormal && Math.abs(movePct) >= 0.9) return "fraud_pump_risk";
  if (rawLabel === "thin_liquidity_move" || rawLabel === "whale_push") {
    if (abnormal && strongRejection) return "fraud_pump_risk";
    return indicators.rangeBreakout ? "organic_demand" : "balanced_market";
  }
  if (rawLabel === "fraud_pump_risk" && !(abnormal && (strongRejection || realizedOutcome === "reversed"))) {
    return indicators.rangeBreakout ? "organic_demand" : "balanced_market";
  }
  if (indicators.rangeBreakout || indicators.volumeZScore >= 1.2 || Math.abs(movePct) >= 0.75) return rawLabel === "balanced_market" ? "organic_demand" : rawLabel;
  return rawLabel;
}

function historicalConfidence(label: string, outcomeLabel: string, confidence: number) {
  if (MANIPULATION_LABELS.includes(label) && outcomeLabel !== "wick_trap" && outcomeLabel !== "reversed") return Math.max(35, confidence - 18);
  return confidence;
}

function detectEvents(symbol: string, timeframe: Timeframe, klines: Kline[]) {
  const events: EventRow[] = [];
  const threshold = thresholdFor(timeframe);
  let lastDirection = 0;
  for (let i = 60; i < klines.length - 2; i++) {
    const window = klines.slice(Math.max(0, i - 80), i + 1);
    const current = klines[i];
    const previous = klines[i - 1];
    const movePct = previous.close > 0 ? (current.close - previous.close) / previous.close * 100 : 0;
    const indicators = calculateIndicators(window);
    const risk = calculateRisk(indicators, flatOrderbook, current.close);
    const cause = calculateCause(indicators, risk, flatOrderbook, flatTrades);
    const absMove = Math.abs(movePct);
    const isSignal =
      absMove >= threshold ||
      indicators.volumeZScore >= 1.8 ||
      indicators.candleExpansion >= 1.6 ||
      indicators.rangeBreakout ||
      (indicators.volumeZScore >= 1.2 && absMove >= threshold * 0.6) ||
      cause.early_warning_score >= 42;
    if (!isSignal) continue;
    const outcomeLabel = outcome(klines, i, movePct, timeframe, indicators);
    const detectedLabel = historicalLabel(cause.likely_cause, outcomeLabel, indicators, movePct);
    const direction = movePct >= 0 ? 1 : -1;
    events.push({
      symbol,
      timeframe,
      event_start: new Date(current.openTime).toISOString(),
      event_end: new Date(current.closeTime).toISOString(),
      move_pct: round(movePct, 2),
      volume_zscore: indicators.volumeZScore,
      detected_label: detectedLabel,
      realized_outcome: outcomeLabel,
      confidence_score: historicalConfidence(detectedLabel, outcomeLabel, cause.confidence_score),
      details_json: { mode: "historical_kline_proxy", indicators, risk, raw_cause: cause },
    });
    i += direction === lastDirection ? 2 : 1;
    lastDirection = direction;
  }
  return events;
}

function countBy(events: Array<Record<string, unknown>>, key: string) {
  return events.reduce((acc, event) => {
    const value = String(event[key] || "unknown");
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function metrics(events: Array<{ symbol?: string; detected_label: string; realized_outcome: string; confidence_score: number }>) {
  const total = events.length;
  const positives = events.filter((event) =>
    event.realized_outcome === "continued" ||
    (event.realized_outcome === "wick_trap" && ["fomo_trap", "fraud_pump_risk"].includes(event.detected_label))
  );
  const falsePositive = events.filter((event) => event.realized_outcome === "low_signal" || event.realized_outcome === "unknown");
  const fraudOrWhale = events.filter((event) => MANIPULATION_LABELS.includes(event.detected_label));
  const coverage = countBy(events as Array<Record<string, unknown>>, "symbol");
  const outcomeDistribution = countBy(events as Array<Record<string, unknown>>, "realized_outcome");
  return {
    event_count: total,
    precision: total ? round(positives.length / total * 100, 1) : 0,
    false_positive_rate: total ? round(falsePositive.length / total * 100, 1) : 0,
    whale_fraud_proxy_rate: total ? round(fraudOrWhale.length / total * 100, 1) : 0,
    avg_confidence: total ? round(events.reduce((sum, event) => sum + Number(event.confidence_score || 0), 0) / total, 1) : 0,
    continued_count: outcomeDistribution.continued || 0,
    reversed_count: outcomeDistribution.reversed || 0,
    trap_count: outcomeDistribution.wick_trap || 0,
    low_signal_count: outcomeDistribution.low_signal || 0,
    label_distribution: countBy(events as Array<Record<string, unknown>>, "detected_label"),
    outcome_distribution: outcomeDistribution,
    coverage_per_symbol: coverage,
    avg_lead_bars: total ? round(events.reduce((sum) => sum + 1, 0) / total, 1) : 0,
  };
}

async function runHistorical(body: Record<string, unknown>, userId: string) {
  const supabase = serviceClient();
  const timeframe = normalizeTimeframe(body.timeframe);
  const symbols = ((body.symbols as string[] | undefined) || ["BTCUSDT", "ETHUSDT", "SOLUSDT"]).slice(0, 20).map(normalizeSymbol);
  const from = body.from ? new Date(String(body.from)).getTime() : Date.now() - 14 * 86400000;
  const to = body.to ? new Date(String(body.to)).getTime() : Date.now();
  const allEvents = [];
  for (const symbol of symbols) {
    const klines = await fetchKlines(symbol, timeframe, 1000, from, to);
    allEvents.push(...detectEvents(symbol, timeframe, klines));
  }
  const metricsJson = metrics(allEvents);
  const { data, error } = await supabase.from("backtest_runs").insert({
    config_json: { mode: "historical_kline", timeframe, from: new Date(from).toISOString(), to: new Date(to).toISOString(), note: "kline_only_proxy_whale_fraud_requires_snapshot" },
    symbols,
    date_range: `[${new Date(from).toISOString()},${new Date(to).toISOString()}]`,
    metrics_json: metricsJson,
    events_json: allEvents.slice(0, 500),
    created_by: userId,
  }).select("*").single();
  if (error) throw error;
  return { run: data, events: allEvents.slice(0, 200), metrics: metricsJson };
}

async function runSnapshot(body: Record<string, unknown>, userId: string) {
  const supabase = serviceClient();
  const timeframe = normalizeTimeframe(body.timeframe);
  const symbols = ((body.symbols as string[] | undefined) || []).map(normalizeSymbol);
  const from = body.from ? new Date(String(body.from)).toISOString() : new Date(Date.now() - 7 * 86400000).toISOString();
  const to = body.to ? new Date(String(body.to)).toISOString() : new Date().toISOString();
  let query = supabase
    .from("movement_events")
    .select("*")
    .eq("timeframe", timeframe)
    .gte("event_start", from)
    .lte("event_start", to)
    .order("event_start", { ascending: false })
    .limit(500);
  if (symbols.length) query = query.in("symbol", symbols);
  const { data: events, error } = await query;
  if (error) throw error;
  const metricsJson = metrics((events || []).map((event) => ({
    symbol: event.symbol,
    detected_label: event.detected_label,
    realized_outcome: event.realized_outcome,
    confidence_score: Number(event.confidence_score || 0),
  })));
  const runSymbols = symbols.length ? symbols : Array.from(new Set((events || []).map((event) => event.symbol)));
  const { data, error: runError } = await supabase.from("backtest_runs").insert({
    config_json: { mode: "snapshot", timeframe, from, to },
    symbols: runSymbols,
    date_range: `[${from},${to}]`,
    metrics_json: metricsJson,
    events_json: events || [],
    created_by: userId,
  }).select("*").single();
  if (runError) throw runError;
  return { run: data, events: events || [], metrics: metricsJson };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, corsHeaders);
  try {
    const user = await requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "historical_kline";
    if (mode === "snapshot") return json(await runSnapshot(body, user.id), 200, corsHeaders);
    return json(await runHistorical(body, user.id), 200, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backtest failed";
    return json({ error: message }, message.includes("Admin") || message.includes("Unauthorized") ? 403 : 500, corsHeaders);
  }
});
