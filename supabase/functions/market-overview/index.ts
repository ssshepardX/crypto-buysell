import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { finishAutomationRun, startAutomationRun } from "../_shared/automation-runs.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
);

type OverviewPanelType = "trend_news" | "scanner" | "gainers" | "losers";
type RunStatus = "not_run" | "success" | "success_empty" | "partial" | "failed";

type PanelMeta = {
  items: unknown[];
  created_at: string | null;
  expires_at: string | null;
  cache_source: string;
  run_status: RunStatus;
  error_summary: string | null;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function ttlMinutes(panel: OverviewPanelType) {
  return panel === "gainers" || panel === "losers" ? 5 : 15;
}

function hasValidCronSecret(req: Request) {
  const secret = Deno.env.get("CRON_SECRET") || "";
  return Boolean(secret && req.headers.get("x-cron-secret") === secret);
}

async function requireAuth(req: Request) {
  if (hasValidCronSecret(req)) return;
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("AUTH_REQUIRED");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error("AUTH_INVALID");
}

function emptyPanel(overrides: Partial<PanelMeta> = {}): PanelMeta {
  return {
    items: [],
    created_at: null,
    expires_at: null,
    cache_source: "none",
    run_status: "not_run",
    error_summary: null,
    ...overrides,
  };
}

async function readLatestRun(jobName: string) {
  const { data, error } = await supabase
    .from("automation_runs")
    .select("status,started_at,finished_at,error_summary,items_count,meta_json")
    .eq("job_name", jobName)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data;
}

async function readPanel(panel: OverviewPanelType) {
  const { data, error } = await supabase
    .from("market_overview_snapshots")
    .select("payload_json,created_at,expires_at")
    .eq("panel_type", panel)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data, error };
}

async function writePanel(panel: OverviewPanelType, payload: Record<string, unknown>) {
  const expiresAt = new Date(Date.now() + ttlMinutes(panel) * 60 * 1000).toISOString();
  const { error } = await supabase.from("market_overview_snapshots").insert({
    panel_type: panel,
    payload_json: { ...payload, expires_at: expiresAt },
    expires_at: expiresAt,
  });
  return { expiresAt, error };
}

async function binance24h() {
  const response = await fetch("https://api.binance.com/api/v3/ticker/24hr");
  if (!response.ok) throw new Error(`BINANCE_${response.status}`);
  const data = await response.json();
  return data
    .filter((row: { symbol: string }) => row.symbol.endsWith("USDT"))
    .map((row: { symbol: string; lastPrice: string; priceChangePercent: string; quoteVolume: string }) => ({
      symbol: row.symbol,
      price: Number(row.lastPrice),
      price_change_percent: Number(row.priceChangePercent),
      quote_volume: Number(row.quoteVolume),
    }))
    .filter((row: { quote_volume: number }) => row.quote_volume > 1000000);
}

async function binanceSparkline(symbol: string, limit = 24) {
  const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=15m&limit=${limit}`);
  if (!response.ok) return [];
  const rows = await response.json();
  return rows.map((row: unknown[]) => Number(row[4]));
}

async function scannerRows() {
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const primary = await supabase
    .from("coin_analyses")
    .select("symbol,created_at,price,risk_json,cause_json,continuation_json,ai_summary_json")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(80);
  if (!primary.error) return primary.data || [];
  const fallback = await supabase
    .from("coin_analyses")
    .select("symbol,created_at,price,risk_json,cause_json,ai_summary_json")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(80);
  return fallback.data || [];
}

async function trendRows() {
  const { data, error } = await supabase
    .from("sentiment_snapshots")
    .select("trend_json,score_json,created_at,expires_at")
    .eq("symbol", "MARKET")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data, error };
}

async function buildGainerLoserPanels() {
  const market = await binance24h();
  const scanner = await scannerRows();
  const scannerBySymbol = new Map(scanner.map((row: Record<string, unknown>) => [row.symbol as string, row]));
  const decorate = async (row: { symbol: string; price: number; price_change_percent: number; quote_volume: number }) => {
    const cached = scannerBySymbol.get(row.symbol) as Record<string, unknown> | undefined;
    const sparkline = await binanceSparkline(row.symbol);
    return {
      symbol: row.symbol,
      price: row.price,
      move_pct: Number(row.price_change_percent.toFixed(2)),
      quote_volume: Math.round(row.quote_volume),
      sparkline,
      cause: (cached?.cause_json as Record<string, unknown> | undefined)?.likely_cause || null,
      continuation: (cached?.continuation_json as Record<string, unknown> | undefined)?.continuation_label || null,
      risk_score: (cached?.risk_json as Record<string, unknown> | undefined)?.pump_dump_risk_score || null,
      reason: (cached?.ai_summary_json as Record<string, unknown> | undefined)?.catalyst_summary || (cached?.ai_summary_json as Record<string, unknown> | undefined)?.summary_tr || null,
      cached_at: cached?.created_at || null,
    };
  };
  const gainers = await Promise.all(market.slice().sort((a, b) => b.price_change_percent - a.price_change_percent).slice(0, 10).map(decorate));
  const losers = await Promise.all(market.slice().sort((a, b) => a.price_change_percent - b.price_change_percent).slice(0, 10).map(decorate));
  return { gainers, losers };
}

async function buildScannerPanel() {
  const rows = await scannerRows();
  const seen = new Set<string>();
  const items = await Promise.all(rows
    .filter((row: Record<string, unknown>) => {
      const symbol = row.symbol as string;
      if (seen.has(symbol)) return false;
      seen.add(symbol);
      return true;
    })
    .slice(0, 10)
    .map(async (row: Record<string, unknown>) => ({
      symbol: row.symbol,
      created_at: row.created_at,
      risk_score: (row.risk_json as Record<string, unknown>)?.pump_dump_risk_score || 0,
      confidence: (row.cause_json as Record<string, unknown>)?.confidence_score || 0,
      cause: (row.cause_json as Record<string, unknown>)?.likely_cause || null,
      continuation: (row.continuation_json as Record<string, unknown>)?.continuation_label || null,
      reason: (row.ai_summary_json as Record<string, unknown>)?.catalyst_summary || (row.ai_summary_json as Record<string, unknown>)?.summary_tr || null,
      sparkline: await binanceSparkline(row.symbol as string),
    })));
  return items;
}

async function buildTrendPanel() {
  const { data: snapshot, error } = await trendRows();
  if (error) return { items: [], created_at: null, expires_at: null, most_mentioned: null, error_summary: error.message };
  const trends = ((snapshot?.trend_json as Record<string, unknown> | undefined)?.trends as Array<Record<string, unknown>> | undefined) || [];
  const items = trends.slice(0, 10).map((trend) => {
    const source = ((trend.source_json as Record<string, unknown> | undefined)?.items as Array<Record<string, unknown>> | undefined)?.find((item) => item.url) ||
      ((trend.source_json as Record<string, unknown> | undefined)?.items as Array<Record<string, unknown>> | undefined)?.[0];
    return {
      symbol: String(trend.symbol || "BTCUSDT"),
      sentiment_score: Number((trend.score_json as Record<string, unknown>)?.sentiment_score || 0),
      sentiment_label: String((trend.score_json as Record<string, unknown>)?.sentiment_label || "neutral"),
      reason: String(source?.summary || (trend.trend_json as Record<string, unknown>)?.reason_short || ""),
      title: String(source?.title || ""),
      url: source?.url ? String(source.url) : null,
      domain: source?.domain ? String(source.domain) : null,
      published_at: source?.published_at ? String(source.published_at) : null,
    };
  });
  return {
    items,
    created_at: snapshot?.created_at || null,
    expires_at: snapshot?.expires_at || null,
    most_mentioned: (snapshot?.score_json as Record<string, unknown> | undefined)?.most_mentioned || null,
    error_summary: null,
  };
}

function normalizePanel(
  payload: Record<string, unknown> | null | undefined,
  run: Record<string, unknown> | null,
  fallback?: Partial<PanelMeta>,
) {
  const normalized = emptyPanel({
    ...fallback,
    items: Array.isArray(payload?.items) ? payload?.items as unknown[] : fallback?.items || [],
    created_at: typeof payload?.created_at === "string" ? payload.created_at as string : fallback?.created_at || null,
    expires_at: typeof payload?.expires_at === "string" ? payload.expires_at as string : fallback?.expires_at || null,
    cache_source: typeof payload?.cache_source === "string" ? payload.cache_source as string : fallback?.cache_source || "none",
    run_status: typeof payload?.run_status === "string" ? payload.run_status as RunStatus : fallback?.run_status || "not_run",
    error_summary: typeof payload?.error_summary === "string" ? payload.error_summary as string : fallback?.error_summary || null,
  });
  if (run) {
    normalized.run_status = (run.status as RunStatus) || normalized.run_status;
    normalized.error_summary = (run.error_summary as string | null) || normalized.error_summary;
    if (!normalized.created_at) normalized.created_at = String(run.finished_at || run.started_at || "");
  }
  return normalized;
}

async function buildOverview() {
  const [
    trendPanel,
    scannerPanel,
    gainersPanel,
    losersPanel,
    trendRun,
    scannerRun,
    overviewRun,
  ] = await Promise.all([
    readPanel("trend_news"),
    readPanel("scanner"),
    readPanel("gainers"),
    readPanel("losers"),
    readLatestRun("sentiment-scan-cache-15m"),
    readLatestRun("market-scanner-cache-15m"),
    readLatestRun("market-overview-cache-5m"),
  ]);

  const trendFallback = await buildTrendPanel();
  const scannerFallbackItems = await buildScannerPanel();
  const moversFallback = await buildGainerLoserPanels();

  const trendNews = normalizePanel(
    trendPanel.data?.payload_json as Record<string, unknown> | undefined,
    trendRun as Record<string, unknown> | null,
    {
      items: trendFallback.items,
      created_at: trendFallback.created_at,
      expires_at: trendFallback.expires_at,
      cache_source: trendPanel.data ? "db" : "live-fallback",
      run_status: trendRun?.status as RunStatus || (trendFallback.items.length ? "success" : "success_empty"),
      error_summary: trendPanel.error?.message || trendFallback.error_summary,
    },
  ) as PanelMeta & { most_mentioned?: string | null };

  const scanner = normalizePanel(
    scannerPanel.data?.payload_json as Record<string, unknown> | undefined,
    scannerRun as Record<string, unknown> | null,
    {
      items: scannerFallbackItems,
      created_at: scannerFallbackItems[0]?.created_at || null,
      cache_source: scannerPanel.data ? "db" : "live-fallback",
      run_status: scannerRun?.status as RunStatus || (scannerFallbackItems.length ? "success" : "success_empty"),
      error_summary: scannerPanel.error?.message || null,
    },
  );

  const gainers = normalizePanel(
    gainersPanel.data?.payload_json as Record<string, unknown> | undefined,
    overviewRun as Record<string, unknown> | null,
    {
      items: moversFallback.gainers,
      cache_source: gainersPanel.data ? "db" : "live-fallback",
      run_status: moversFallback.gainers.length ? "success" : "success_empty",
      error_summary: gainersPanel.error?.message || null,
    },
  );

  const losers = normalizePanel(
    losersPanel.data?.payload_json as Record<string, unknown> | undefined,
    overviewRun as Record<string, unknown> | null,
    {
      items: moversFallback.losers,
      cache_source: losersPanel.data ? "db" : "live-fallback",
      run_status: moversFallback.losers.length ? "success" : "success_empty",
      error_summary: losersPanel.error?.message || null,
    },
  );

  return {
    trend_news: {
      ...trendNews,
      most_mentioned: (trendPanel.data?.payload_json as Record<string, unknown> | undefined)?.most_mentioned || trendFallback.most_mentioned || null,
    },
    scanner,
    gainers,
    losers,
    created_at: [trendNews.created_at, scanner.created_at, gainers.created_at, losers.created_at].filter(Boolean).sort().at(-1) || null,
  };
}

async function refreshOverview() {
  const runId = await startAutomationRun("market-overview-cache-5m");
  try {
    const [trend_news, scannerItems, movers] = await Promise.all([
      buildTrendPanel(),
      buildScannerPanel(),
      buildGainerLoserPanels(),
    ]);

    const trendPayload = {
      items: trend_news.items,
      created_at: trend_news.created_at || new Date().toISOString(),
      cache_source: "cron",
      run_status: trend_news.items.length ? "success" : "success_empty",
      error_summary: trend_news.error_summary,
      most_mentioned: trend_news.most_mentioned,
    };
    const scannerPayload = {
      items: scannerItems,
      created_at: scannerItems[0]?.created_at || new Date().toISOString(),
      cache_source: "cron",
      run_status: scannerItems.length ? "success" : "success_empty",
      error_summary: null,
    };
    const gainersPayload = {
      items: movers.gainers,
      created_at: new Date().toISOString(),
      cache_source: "cron",
      run_status: movers.gainers.length ? "success" : "success_empty",
      error_summary: null,
    };
    const losersPayload = {
      items: movers.losers,
      created_at: new Date().toISOString(),
      cache_source: "cron",
      run_status: movers.losers.length ? "success" : "success_empty",
      error_summary: null,
    };

    const writes = await Promise.all([
      writePanel("trend_news", trendPayload),
      writePanel("scanner", scannerPayload),
      writePanel("gainers", gainersPayload),
      writePanel("losers", losersPayload),
    ]);
    const writeErrors = writes.map((write) => write.error?.message).filter(Boolean);
    const status: RunStatus = writeErrors.length
      ? "partial"
      : (trend_news.items.length || scannerItems.length || movers.gainers.length || movers.losers.length ? "success" : "success_empty");

    await finishAutomationRun(runId, status, trend_news.items.length + scannerItems.length + movers.gainers.length + movers.losers.length, writeErrors.join(" | ") || null, {
      write_errors: writeErrors,
    });

    return {
      trend_news: { ...trendPayload, expires_at: writes[0].expiresAt },
      scanner: { ...scannerPayload, expires_at: writes[1].expiresAt },
      gainers: { ...gainersPayload, expires_at: writes[2].expiresAt },
      losers: { ...losersPayload, expires_at: writes[3].expiresAt },
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    await finishAutomationRun(runId, "failed", 0, error instanceof Error ? error.message.slice(0, 400) : "market_overview_failed");
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    await requireAuth(req);
    if (req.method === "POST") return json(await refreshOverview());
    return json(await buildOverview());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Market overview failed";
    const status = message.startsWith("AUTH_") ? 401 : 500;
    return json({ error: message }, status);
  }
});

