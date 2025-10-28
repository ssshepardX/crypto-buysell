import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { RSI, WMA } from "https://esm.sh/technicalindicators@3.1.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- Supabase Client Setup ---
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Supabase environment variables are not set.");
}
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// --- Helper Functions ---

// technicalindicators kütüphanesinde HMA olmadığı için manuel olarak hesaplıyoruz.
// HMA = WMA(2 * WMA(period/2) - WMA(period))
const calculateHMA = (prices: number[], period: number) => {
  const halfPeriod = Math.floor(period / 2);
  const sqrtPeriod = Math.round(Math.sqrt(period));

  const wmaHalf = WMA.calculate({ period: halfPeriod, values: prices });
  const wmaFull = WMA.calculate({ period: period, values: prices });

  const diffWma = wmaHalf.map((val, index) => {
    const offset = wmaHalf.length - wmaFull.length;
    return 2 * val - wmaFull[index + offset];
  });

  return WMA.calculate({ period: sqrtPeriod, values: diffWma });
};

async function fetchBinanceKlines(symbol: string, interval = '15m', limit = 100) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Binance API request failed for ${symbol}: ${response.statusText}`);
  return await response.json();
}

// --- Main Function ---
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { symbol } = await req.json();
    if (!symbol) throw new Error("Symbol is required.");

    // 1. Fetch 15-minute Market Data
    const klines = await fetchBinanceKlines(symbol);
    if (klines.length < 21) { // HMA(21) için yeterli veri lazım
      return new Response(JSON.stringify({ signal: 'Hold', reasoning: 'Not enough market data.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
      });
    }

    const closePrices = klines.map(k => parseFloat(k[4]));
    const volumes = klines.map(k => parseFloat(k[5]));

    // 2. Calculate Indicators based on the new strategy
    const hma8 = calculateHMA(closePrices, 8);
    const hma21 = calculateHMA(closePrices, 21);
    const rsi7 = RSI.calculate({ period: 7, values: closePrices });

    const lastHma8 = hma8[hma8.length - 1];
    const lastHma21 = hma21[hma21.length - 1];
    const lastRsi7 = rsi7[rsi7.length - 1];

    // 3. Volume Filter
    const last20Volumes = volumes.slice(-21, -1);
    const avgVolume = last20Volumes.reduce((a, b) => a + b, 0) / last20Volumes.length;
    const lastVolume = volumes[volumes.length - 1];

    if (lastVolume < avgVolume * 0.6) {
      return new Response(JSON.stringify({ signal: 'Hold', reasoning: 'Low volume, signal ignored.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
      });
    }

    // 4. Apply Trading Logic
    let signal = 'Hold';
    let reasoning = 'Market conditions do not meet buy or sell criteria.';

    // BUY Condition: HMA(8) > HMA(21) AND RSI(7) < 70
    if (lastHma8 > lastHma21 && lastRsi7 < 70) {
      signal = 'Buy';
      reasoning = `HMA(8) crossed above HMA(21) with RSI(${lastRsi7.toFixed(1)}) below 70.`;
    }
    // SELL Condition: HMA(8) < HMA(21) AND RSI(7) > 30
    else if (lastHma8 < lastHma21 && lastRsi7 > 30) {
      signal = 'Sell';
      reasoning = `HMA(8) crossed below HMA(21) with RSI(${lastRsi7.toFixed(1)}) above 30.`;
    }

    // 5. Log the signal to the database (optional, but good practice)
    // For simplicity, we are not logging every hold signal to avoid clutter.
    if (signal !== 'Hold') {
        await supabaseAdmin.from('signals_log').insert({
            symbol: symbol.replace('USDT', ''),
            signal_type: signal,
            status: 'active_signal', // A new status to differentiate from trades
            price: closePrices[closePrices.length - 1],
            reasoning: reasoning,
        });
    }

    return new Response(JSON.stringify({ signal, reasoning }), {
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