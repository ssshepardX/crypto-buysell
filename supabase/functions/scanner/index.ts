// SUPABASE EDGE FUNCTION - Complete Market Scanner & AI Analyzer
// Moves all processing from browser to server-side background processing
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- Supabase Client Setup ---
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
  console.error("Missing required environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);

// --- Global Configuration ---
const CONFIG = {
  maxCoins: 20,
  intervalMs: 30000, // 30 seconds between scans
  volumeMultiplier: 2.5,
  priceChangeThreshold: 0.03,
  cacheMinutes: 15
};

// --- Helper: Fetch Binance 24hr Ticker ---
async function getBinance24hrData(symbol: string): Promise<any | null> {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${symbol} ticker:`, error);
    return null;
  }
}

// --- Helper: Fetch Top Coins ---
async function getTopCoins(): Promise<any[]> {
  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    if (!response.ok) return [];

    const allTickers = await response.json();
    return allTickers
      .filter((ticker: any) => ticker.symbol.endsWith('USDT'))
      .sort((a: any, b: any) => b.quoteVolume - a.quoteVolume)
      .slice(0, CONFIG.maxCoins)
      .map((ticker: any) => ({
        symbol: ticker.symbol.replace('USDT', ''),
        price: parseFloat(ticker.lastPrice),
        priceChange: parseFloat(ticker.priceChangePercent),
        volume: parseFloat(ticker.volume),
        quoteVolume: parseFloat(ticker.quoteVolume)
      }));
  } catch (error) {
    console.error('Failed to fetch top coins:', error);
    return [];
  }
}

// --- Helper: Check Cache ---
async function checkCache(symbol: string): Promise<boolean> {
  try {
    const cacheCutoff = new Date(Date.now() - CONFIG.cacheMinutes * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('analysis_jobs')
      .select('id')
      .eq('symbol', symbol)
      .eq('status', 'COMPLETED')
      .gte('created_at', cacheCutoff)
      .limit(1);

    if (error) {
      console.error('Cache check error:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Cache check failed:', error);
    return false;
  }
}

// --- LAYER 1: Mechanical Filter ---
function passesMechanicalFilter(coinData: any): boolean {
  // Price Change (5m) threshold is approximate from 24hr data
  if (coinData.priceChange < 2.0) return false;

  // Volume multiplier (using 24hr average approximation)
  const avgVolumeApprox = coinData.quoteVolume / 24; // Rough hourly average
  const currentVolumeEstimate = coinData.volume;
  const volumeMultiplier = currentVolumeEstimate / avgVolumeApprox;

  if (volumeMultiplier <= 3.0) return false;

  // Market Cap check (approximate from price * volume)
  const marketCapApprox = coinData.price * coinData.quoteVolume;
  if (marketCapApprox <= 10000000) return false; // $10M threshold

  return true;
}

// --- LAYER 2: Math-based Risk Scoring ---
function calculateRiskScore(coinData: any): number {
  let score = 0;
  // Simplified scoring without detailed technical data
  const priceChange = coinData.priceChange;
  const volumeMultiplier = coinData.volume / (coinData.quoteVolume / 24);

  // Price change scoring
  if (priceChange >= 5) score += 20; // Panic buy
  if (priceChange >= 3) score += 10;

  // Volume scoring
  if (volumeMultiplier >= 4) score += 15; // Overheated
  if (volumeMultiplier >= 2) score += 10;

  return Math.min(score, 100);
}

// --- LAYER 3: AI Qualitative Analysis ---
async function analyzeWithGemini(baseScore: number, coinData: any): Promise<any> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `ROLE: You are a cynical crypto risk analyst. You look for traps.

INPUT DATA:
- Symbol: ${coinData.symbol}
- Math Risk Score: ${baseScore}/100
- 24hr Price Change: ${coinData.priceChange.toFixed(2)}%
- Estimated Volume Multiplier: ${(coinData.volume / (coinData.quoteVolume / 24)).toFixed(1)}x

TASK:
1. Validate the Risk Score. Does it make sense given market data?
2. Provide a 1-sentence 'Verdict' (Warning or Opportunity).
3. Identify the 'Likely Scenario' (e.g., 'FOMO Trap', 'Whale Manipulation', 'Organic Breakout').

OUTPUT: JSON only with exact keys:
{
  "final_risk_score": ${baseScore},
  "verdict": "One sentence verdict",
  "likely_scenario": "Scenario name",
  "short_comment": "Brief advice"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json\s*|```\s*/g, '').trim();

    const analysis = JSON.parse(text);
    return {
      final_risk_score: Math.max(0, Math.min(100, analysis.final_risk_score || baseScore)),
      verdict: analysis.verdict || 'Analysis inconclusive',
      likely_scenario: analysis.likely_scenario || 'Unknown scenario',
      short_comment: analysis.short_comment || 'Monitor closely'
    };
  } catch (error) {
    console.error('Gemini analysis error:', error);
    return {
      final_risk_score: baseScore,
      verdict: 'Analysis failed - monitor closely',
      likely_scenario: 'Uncertain conditions',
      short_comment: 'Manual review recommended'
    };
  }
}

// --- Save Analysis to Database ---
async function saveAnalysis(symbol: string, riskScore: number, aiResults: any) {
  try {
    // Insert analysis job
    const { data, error } = await supabase
      .from('analysis_jobs')
      .insert({
        symbol: symbol,
        status: 'COMPLETED',
        price_at_detection: 0, // TODO: Get actual price
        price_change: 0,
        volume_spike: 1,
        orderbook_json: '{}',
        social_json: '{}',
        risk_score: riskScore,
        summary: aiResults.verdict,
        likely_source: aiResults.likely_scenario,
        actionable_insight: aiResults.short_comment,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error(`Failed to save analysis for ${symbol}:`, error);
    } else {
      console.log(`✅ Analysis saved: ${symbol} (Score: ${riskScore})`);
    }
  } catch (error) {
    console.error(`Save analysis error for ${symbol}:`, error);
  }
}

// --- MAIN SCANNING LOOP ---
async function scanMarket() {
  console.log(`🔍 Starting market scan at ${new Date().toISOString()}...`);

  try {
    const topCoins = await getTopCoins();
    console.log(`📊 Found ${topCoins.length} coins to scan`);

    let anomaliesFound = 0;

    for (const coinData of topCoins) {
      try {
        // Check cache
        const inCache = await checkCache(coinData.symbol);
        if (inCache) {
          console.log(`⏰ ${coinData.symbol}: Cache hit - skipping`);
          continue;
        }

        // LAYER 1: Mechanical Filter
        const passesFilter = passesMechanicalFilter(coinData);
        if (!passesFilter) {
          continue;
        }

        console.log(`🚨 ${coinData.symbol}: Passes mechanical filter!`);

        // LAYER 2: Math-based Risk Scoring
        const baseRiskScore = calculateRiskScore(coinData);
        console.log(`🔢 ${coinData.symbol}: Base risk score = ${baseRiskScore}`);

        // LAYER 3: AI Qualitative Analysis
        const aiResults = await analyzeWithGemini(baseRiskScore, coinData);
        const finalScore = aiResults.final_risk_score;

        console.log(`🤖 ${coinData.symbol}: AI Analysis - ${aiResults.verdict}`);

        // Save to database
        await saveAnalysis(coinData.symbol, finalScore, aiResults);

        anomaliesFound++;
      } catch (error) {
        console.error(`Error processing ${coinData.symbol}:`, error);
      }
    }

    console.log(`🎯 Scan completed: ${anomaliesFound} anomalies analyzed`);
    console.log(`⏱️ Next scan in ${CONFIG.intervalMs / 1000} seconds...`);

  } catch (error) {
    console.error('Market scan error:', error);
  }
}

// --- MAIN ENDPOINT HANDLER ---
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method === 'POST') {
    // Trigger a manual scan
    await scanMarket();
    return new Response(JSON.stringify({
      message: 'Manual scan completed',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  if (req.method === 'GET') {
    // Return current scan status
    const { data: recentScans, error } = await supabase
      .from('analysis_jobs')
      .select('*')
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({
      scans: recentScans || [],
      totalScans: recentScans?.length || 0,
      lastUpdate: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 405,
  });
});

// --- AUTO SCANNING LOOP ---
let isScanning = false;

async function autoScanLoop() {
  while (true) {
    try {
      if (!isScanning) {
        isScanning = true;
        await scanMarket();
        isScanning = false;
      }
    } catch (error) {
      console.error('Auto scan error:', error);
      isScanning = false;
    }

    // Wait before next scan
    await new Promise(resolve => setTimeout(resolve, CONFIG.intervalMs));
  }
}

// Start auto scanning when function loads
console.log("🚀 Starting Supabase Market Scanner...");
autoScanLoop();
