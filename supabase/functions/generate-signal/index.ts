import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { EMA, RSI, BollingerBands, MACD } from "https://esm.sh/technicalindicators@3.1.0";
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


// --- Main Function ---
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { symbol } = await req.json(); // e.g., "BTCUSDT"
    if (!symbol) throw new Error("Symbol is required.");

    // 1. Fetch Market Data
    const klines = await fetchBinanceKlines(symbol);
    const closePrices = klines.map(k => parseFloat(k[4]));
    const lastPrice = closePrices[closePrices.length - 1];

    // 2. Check for Active Trade in DB
    const { data: activeTrade, error: dbError } = await supabaseAdmin
      .from('signals_log')
      .select('*')
      .eq('symbol', symbol.replace('USDT', ''))
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (dbError && dbError.code !== 'PGRST116') { // Ignore 'no rows found' error
      throw dbError;
    }

    let finalSignal;

    if (activeTrade) {
      // 3a. Active trade exists -> Look for a SELL signal
      finalSignal = await analyzeForSell(symbol, lastPrice, closePrices, activeTrade);
    } else {
      // 3b. No active trade -> Look for a BUY signal
      finalSignal = await analyzeForBuy(symbol, lastPrice, closePrices);
    }

    return new Response(JSON.stringify(finalSignal), {
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


// --- Analysis Functions ---

async function analyzeForBuy(symbol: string, price: number, prices: number[]) {
  const { score, analysis, conditionsMet } = performTechnicalAnalysis(prices);

  // Puan eşiğini geçemezse, AI'ı hiç rahatsız etme.
  if (score < 3) {
    return { signal: 'Hold', reasoning: 'No strong technical buy signals detected at the moment.' };
  }

  const prompt = `
    You are an expert crypto analyst. Your task is to confirm a potential buying opportunity identified by our technical indicators.
    
    Coin: ${symbol}
    Current Price: ${price.toFixed(4)}
    
    Our system has flagged this coin with a technical score of ${score}/5. The following conditions were met:
    ${conditionsMet.join('\n')}
    
    Technical Data Snapshot:
    - RSI (14): ${analysis.rsi.toFixed(2)}
    - MACD Line / Signal Line: ${analysis.macd.MACD.toFixed(4)} / ${analysis.macd.signal.toFixed(4)}
    - Bollinger Bands (Upper/Middle/Lower): ${analysis.bollingerBands.upper.toFixed(4)} / ${analysis.bollingerBands.middle.toFixed(4)} / ${analysis.bollingerBands.lower.toFixed(4)}
    - EMA (50): ${analysis.ema50.toFixed(4)}

    Based on this strong technical pre-screening, please perform a final check. 
    1. Confirm if this is a 'Buy' signal or if we should 'Hold'.
    2. Provide a concise reasoning for your decision in simple terms for the user.
    3. If you signal 'Buy', you MUST provide three realistic take-profit levels (tp1, tp2, tp3) and a risk assessment ('Low', 'Moderate', or 'High').

    Return your response ONLY as a valid JSON object.
    For "Buy": { "signal": "Buy", "reasoning": "...", "tp1": ..., "tp2": ..., "tp3": ..., "risk": "Low" | "Moderate" | "High" }
    For "Hold": { "signal": "Hold", "reasoning": "..." }
  `;

  const aiResponse = await getAiResponse(prompt);

  if (aiResponse.signal === 'Buy') {
    const { data, error } = await supabaseAdmin.from('signals_log').insert({
      symbol: symbol.replace('USDT', ''),
      signal_type: 'Buy',
      status: 'active',
      price: price,
      reasoning: aiResponse.reasoning,
      tp1: aiResponse.tp1,
      tp2: aiResponse.tp2,
      tp3: aiResponse.tp3,
      risk: aiResponse.risk,
    }).select().single();
    if (error) throw error;
    return { ...data, risk: aiResponse.risk };
  }
  return aiResponse;
}

async function analyzeForSell(symbol: string, price: number, prices: number[], trade: any) {
  const { analysis } = performTechnicalAnalysis(prices);
  const profit = ((price - trade.price) / trade.price) * 100;
  const prompt = `
    You are a portfolio manager. We have an active 'Buy' position for ${symbol} bought at $${trade.price}.
    The current price is $${price.toFixed(4)}, representing a current profit/loss of ${profit.toFixed(2)}%.
    
    Indicators:
    - RSI (14): ${analysis.rsi.toFixed(2)}
    - MACD Line / Signal Line: ${analysis.macd.MACD.toFixed(4)} / ${analysis.macd.signal.toFixed(4)}
    - Bollinger Bands (Upper/Middle/Lower): ${analysis.bollingerBands.upper.toFixed(4)} / ${analysis.bollingerBands.middle.toFixed(4)} / ${analysis.bollingerBands.lower.toFixed(4)}

    Given the market conditions (especially if RSI is approaching overbought > 65, or a bearish MACD cross is forming), our entry point, and current P/L, should we 'Sell' now to take profit/cut loss, or 'Hold' for more potential?
    
    Return your response ONLY as a valid JSON object.
    For "Sell": { "signal": "Sell", "reasoning": "..." }
    For "Hold": { "signal": "Hold", "reasoning": "..." }
  `;

  const aiResponse = await getAiResponse(prompt);

  if (aiResponse.signal === 'Sell') {
    const { error: updateError } = await supabaseAdmin
      .from('signals_log')
      .update({ status: 'closed', closed_at: new Date().toISOString(), profit_loss_percent: profit })
      .eq('id', trade.id);
    if (updateError) throw updateError;

    const { data, error: insertError } = await supabaseAdmin.from('signals_log').insert({
      symbol: symbol.replace('USDT', ''),
      signal_type: 'Sell',
      status: 'closed',
      price: price,
      reasoning: aiResponse.reasoning,
      related_buy_id: trade.id,
      profit_loss_percent: profit,
    }).select().single();
    if (insertError) throw insertError;
    return data;
  }
  return aiResponse;
}


// --- Helper & Technical Analysis Functions ---

async function getAiResponse(prompt: string) {
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  try {
    const jsonString = responseText.replace(/```json\n|```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse AI response:", responseText);
    return { signal: 'Hold', reasoning: 'Could not determine signal due to an analysis error.' };
  }
}

async function fetchBinanceKlines(symbol: string, interval = '1h', limit = 100) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Binance API request failed: ${response.statusText}`);
  return await response.json();
}

function performTechnicalAnalysis(prices: number[]) {
  if (prices.length < 50) throw new Error("Not enough data for analysis.");
  
  const last = <T>(arr: T[]): T => arr[arr.length - 1];
  const secondLast = <T>(arr: T[]): T => arr[arr.length - 2];

  const rsi = last(RSI.calculate({ period: 14, values: prices }));
  const macdResult = MACD.calculate({
    values: prices,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });
  const lastMacd = last(macdResult);
  const secondLastMacd = secondLast(macdResult);
  const bollingerBands = last(BollingerBands.calculate({ period: 20, stdDev: 2, values: prices }));
  const ema50 = last(EMA.calculate({ period: 50, values: prices }));
  const lastPrice = last(prices);

  let score = 0;
  const conditionsMet = [];

  // Condition 1: RSI is in oversold or potential reversal territory
  if (rsi < 35) {
    score += 1;
    conditionsMet.push("- RSI is low (${rsi.toFixed(2)}), indicating it might be oversold.");
  }

  // Condition 2: Bullish MACD Crossover
  if (secondLastMacd.MACD < secondLastMacd.signal && lastMacd.MACD > lastMacd.signal) {
    score += 2;
    conditionsMet.push("- A bullish MACD crossover just occurred, signaling upward momentum.");
  }

  // Condition 3: Price is near or below lower Bollinger Band
  if (lastPrice <= bollingerBands.lower) {
    score += 1;
    conditionsMet.push("- Price touched the lower Bollinger Band, suggesting a potential bounce.");
  }

  // Condition 4: Price is above a key trend indicator (50 EMA)
  if (lastPrice > ema50) {
    score += 1;
    conditionsMet.push("- The price is above the 50-period EMA, confirming a potential uptrend.");
  }

  return {
    score,
    conditionsMet,
    analysis: {
      rsi,
      macd: lastMacd,
      bollingerBands,
      ema50
    }
  };
}