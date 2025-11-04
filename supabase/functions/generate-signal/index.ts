import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { RSI, WMA } from "https://esm.sh/technicalindicators@3.1.0";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- Gemini AI Setup ---
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
if (!GEMINI_API_KEY) console.error("GEMINI_API_KEY is not set.");
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- Supabase Client Setup ---
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Supabase environment variables are not set.");
}
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// --- Helper: Calculate HMA ---
const calculateHMA = (prices: number[], period: number) => {
  const halfPeriod = Math.floor(period / 2);
  const sqrtPeriod = Math.round(Math.sqrt(period));
  const wmaHalf = WMA.calculate({ period: halfPeriod, values: prices });
  const wmaFull = WMA.calculate({ period: period, values: prices });
  if (wmaHalf.length === 0 || wmaFull.length === 0) return [];
  const diffWma = wmaHalf.map((val, index) => {
    const offset = wmaHalf.length - wmaFull.length;
    return 2 * val - wmaFull[index + offset];
  });
  return WMA.calculate({ period: sqrtPeriod, values: diffWma });
};

// --- Helper: Fetch Binance Klines ---
async function fetchBinanceKlines(symbol: string, interval = '15m', limit = 100) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) {
    console.warn(`Binance API request failed for ${symbol}: ${response.statusText}`);
    return [];
  }
  return await response.json();
}

// --- Helper: Get AI Response ---
async function getAiResponse(prompt: string) {
  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonString = responseText.replace(/```json\n|```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    return { signal: 'Hold', reasoning: 'AI analysis failed or returned invalid format.' };
  }
}

// --- Main Function ---
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { symbol } = await req.json();
    if (!symbol) throw new Error("Symbol is required.");

    const klines = await fetchBinanceKlines(symbol);
    if (klines.length < 22) { // Need at least 22 for previous HMA
      return new Response(JSON.stringify({ signal: 'Hold', reasoning: 'Not enough market data.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
      });
    }

    const closePrices = klines.map(k => parseFloat(k[4]));
    const volumes = klines.map(k => parseFloat(k[5]));

    // Calculate Indicators
    const hma8 = calculateHMA(closePrices, 8);
    const hma21 = calculateHMA(closePrices, 21);
    const rsi7 = RSI.calculate({ period: 7, values: closePrices });

    if (hma8.length < 2 || hma21.length < 2 || rsi7.length < 1) {
       return new Response(JSON.stringify({ signal: 'Hold', reasoning: 'Indicator calculation failed.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
      });
    }

    const lastHma8 = hma8[hma8.length - 1];
    const prevHma8 = hma8[hma8.length - 2];
    const lastHma21 = hma21[hma21.length - 1];
    const prevHma21 = hma21[hma21.length - 2];
    const lastRsi7 = rsi7[rsi7.length - 1];

    // Volume Filter - More lenient now (40% of average)
    const avgVolume = volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
    if (volumes[volumes.length - 1] < avgVolume * 0.4) {
      return new Response(JSON.stringify({ signal: 'Hold', reasoning: 'Signal ignored due to extremely low volume.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
      });
    }

    // --- The Hybrid Logic ---
    // More lenient RSI conditions for both buy and sell signals
    // BUY Trigger: HMA(8) crosses UP HMA(21) with RSI below 75
    const isBuyTrigger = (prevHma8 <= prevHma21 && lastHma8 > lastHma21 && lastRsi7 < 75) || 
                        (lastHma8 > lastHma21 * 1.001 && lastRsi7 < 40); // Strong oversold condition
    
    // SELL Trigger: HMA(8) crosses DOWN HMA(21) with RSI above 25
    const isSellTrigger = (prevHma8 >= prevHma21 && lastHma8 < lastHma21 && lastRsi7 > 25) ||
                         (lastHma8 < lastHma21 * 0.999 && lastRsi7 > 80); // Strong overbought condition

    if (isBuyTrigger) {
      const prompt = `
        You are an expert crypto analyst. A high-potential 'BUY' signal has been detected for ${symbol} based on a bullish HMA crossover.
        - Crossover Price: ${closePrices[closePrices.length - 1]}
        - RSI(7): ${lastRsi7.toFixed(2)}
        - HMA(8) / HMA(21): ${lastHma8.toFixed(4)} / ${lastHma21.toFixed(4)}
        
        Your tasks:
        1. Confirm this is a 'Buy' signal.
        2. Provide a very concise reasoning (max 15 words).
        3. Define a risk level: 'Low', 'Moderate', or 'High'.
        4. Provide three realistic take-profit levels (tp1, tp2, tp3).
        
        Return ONLY a valid JSON object like this:
        { "signal": "Buy", "reasoning": "...", "risk": "Moderate", "tp1": ..., "tp2": ..., "tp3": ... }
      `;
      const aiResponse = await getAiResponse(prompt);
      return new Response(JSON.stringify(aiResponse), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

    } else if (isSellTrigger) {
       const prompt = `
        You are an expert crypto analyst. A potential 'SELL' signal has been detected for ${symbol} based on a bearish HMA crossover.
        - Crossover Price: ${closePrices[closePrices.length - 1]}
        - RSI(7): ${lastRsi7.toFixed(2)}
        - HMA(8) / HMA(21): ${lastHma8.toFixed(4)} / ${lastHma21.toFixed(4)}
        
        Your tasks:
        1. Confirm this is a 'Sell' signal.
        2. Provide a very concise reasoning (max 15 words).
        
        Return ONLY a valid JSON object like this:
        { "signal": "Sell", "reasoning": "..." }
      `;
      const aiResponse = await getAiResponse(prompt);
      return new Response(JSON.stringify(aiResponse), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // Default to Hold
    return new Response(JSON.stringify({ signal: 'Hold', reasoning: 'No crossover event detected.' }), {
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