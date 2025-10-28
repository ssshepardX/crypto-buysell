import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { EMA, RSI, BollingerBands } from "https://deno.land/x/technicalindicators@v1.0.0/mod.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- Gemini AI Kurulumu ---
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set.");
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- Ana Fonksiyon ---
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { symbol } = await req.json();
    if (!symbol) {
      throw new Error("Symbol is required.");
    }

    // 1. Binance'ten Veri Çek
    const klines = await fetchBinanceKlines(symbol);
    const closePrices = klines.map(k => parseFloat(k[4]));
    const lastPrice = closePrices[closePrices.length - 1];

    // 2. Yerel Teknik Analiz Yap
    const analysis = performTechnicalAnalysis(closePrices);

    // 3. Gemini'ye Gönder ve Sinyal Al
    const aiSignal = await getAiSignal(symbol, lastPrice, analysis);

    return new Response(JSON.stringify(aiSignal), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in edge function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// --- Yardımcı Fonksiyonlar ---

async function fetchBinanceKlines(symbol: string, interval = '1h', limit = 100) {
  const BINANCE_API_KEY = Deno.env.get("BINANCE_API_KEY");
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const response = await fetch(url, {
    headers: { 'X-MBX-APIKEY': BINANCE_API_KEY || '' },
  });
  if (!response.ok) {
    throw new Error(`Binance API request failed: ${response.statusText}`);
  }
  return await response.json();
}

function performTechnicalAnalysis(prices: number[]) {
  if (prices.length < 50) {
    throw new Error("Not enough data for analysis (_need at least 50 points_).");
  }
  
  const last = <T>(arr: T[]): T => arr[arr.length - 1];

  const ema9 = last(EMA.calculate({ period: 9, values: prices }));
  const ema21 = last(EMA.calculate({ period: 21, values: prices }));
  const ema50 = last(EMA.calculate({ period: 50, values: prices }));
  const rsi = last(RSI.calculate({ period: 14, values: prices }));
  const bb = last(BollingerBands.calculate({ period: 20, stdDev: 2, values: prices }));

  return { ema9, ema21, ema50, rsi, bollingerBands: bb };
}

async function getAiSignal(symbol: string, price: number, analysis: any) {
  const prompt = `
    You are an expert crypto analyst. Your task is to provide a clear 'Buy', 'Sell', or 'Hold' signal.
    Analyze the following technical data for ${symbol} and provide a concise signal and reasoning.

    Current Price: ${price.toFixed(4)}

    Technical Indicators:
    - EMA (9-period): ${analysis.ema9.toFixed(4)}
    - EMA (21-period): ${analysis.ema21.toFixed(4)}
    - EMA (50-period): ${analysis.ema50.toFixed(4)}
    - RSI (14-period): ${analysis.rsi.toFixed(2)}
    - Bollinger Bands:
      - Upper: ${analysis.bollingerBands.upper.toFixed(4)}
      - Middle: ${analysis.bollingerBands.middle.toFixed(4)}
      - Lower: ${analysis.bollingerBands.lower.toFixed(4)}

    Analysis Rules:
    1.  **Trend:** Is the price above the EMA50 (uptrend) or below (downtrend)? Is the EMA9 crossing the EMA21?
    2.  **Momentum:** Is the RSI over 70 (overbought), under 30 (oversold), or neutral?
    3.  **Volatility:** Is the price near the upper or lower Bollinger Band, suggesting a potential reversal or breakout?

    Based on your analysis of these indicators, what is your signal?
    Return your response ONLY as a valid JSON object with two keys: "signal" (string: "Buy", "Sell", or "Hold") and "reasoning" (a brief, one-sentence explanation).
    
    Example:
    {
      "signal": "Buy",
      "reasoning": "The price is in a clear uptrend above the EMA50, and the recent bullish crossover of EMA9/EMA21 suggests strong upward momentum."
    }
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  try {
    // Clean the response to ensure it's valid JSON
    const jsonString = responseText.replace(/```json\n|```/g, '').trim();
    const parsed = JSON.parse(jsonString);
    if (!['Buy', 'Sell', 'Hold'].includes(parsed.signal) || !parsed.reasoning) {
      throw new Error("Invalid JSON structure from AI.");
    }
    return parsed;
  } catch (e) {
    console.error("Failed to parse AI response:", responseText);
    // Fallback to a Hold signal if AI response is malformed
    return { signal: 'Hold', reasoning: 'Could not determine signal due to an analysis error.' };
  }
}