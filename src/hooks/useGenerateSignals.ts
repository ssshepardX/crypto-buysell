import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTop200CoinsByVolume } from '@/services/binanceService';

type BinanceKline = [
  number, // 0: Open time
  string, // 1: Open
  string, // 2: High
  string, // 3: Low
  string, // 4: Close
  string, // 5: Volume
  number, // 6: Close time
  string, // 7: Quote asset volume
  number, // 8: Number of trades
  string, // 9: Taker buy base asset volume
  string, // 10: Taker buy quote asset volume
  string  // 11: Unused
];

export interface SignalGenerationConfig {
  maxCoins: number;
  interval: '1m' | '5m' | '15m' | '1h';
  enabled: boolean;
}

const DEFAULT_CONFIG: SignalGenerationConfig = {
  maxCoins: 200,
  interval: '15m', // Optimal for signal generation
  enabled: true
};

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Calculate HMA
const calculateHMA = (prices: number[], period: number) => {
  const halfPeriod = Math.floor(period / 2);
  const sqrtPeriod = Math.round(Math.sqrt(period));
  
  // Simple moving average
  const sma = (arr: number[], p: number) => {
    const result = [];
    for (let i = p - 1; i < arr.length; i++) {
      const sum = arr.slice(i - p + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / p);
    }
    return result;
  };
  
  const wmaHalf = sma(prices, halfPeriod);
  const wmaFull = sma(prices, period);
  
  if (wmaHalf.length === 0 || wmaFull.length === 0) return [];
  
  const diffWma = wmaHalf.map((val, index) => {
    const offset = wmaHalf.length - wmaFull.length;
    return 2 * val - (wmaFull[index + offset] || wmaFull[wmaFull.length - 1]);
  });
  
  return sma(diffWma, sqrtPeriod);
};

// Calculate RSI
const calculateRSI = (prices: number[], period: number) => {
  const rsi = [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;

    if (i === period) {
      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    } else if (i > period) {
      const avgGain = (rsi[i - period - 1] === undefined ? gains : (gains / period)) / 2;
      const avgLoss = (rsi[i - period - 1] === undefined ? losses : (losses / period)) / 2;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }

  return rsi;
};

// Fetch Binance klines
async function fetchBinanceKlines(symbol: string, interval = '15m', limit = 100): Promise<BinanceKline[]> {
  try {
    // Ensure symbol is in correct format (e.g., BTCUSDT)
    const formattedSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
    const url = `https://api.binance.com/api/v3/klines?symbol=${formattedSymbol}&interval=${interval}&limit=${limit}`;

    console.log(`Fetching klines from: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Binance API error for ${formattedSymbol}: ${response.status} ${response.statusText}`);
      return [];
    }
    const data: BinanceKline[] = await response.json();
    console.log(`Got ${data.length} klines for ${formattedSymbol}`);
    return data;
  } catch (error) {
    console.error(`Error fetching klines for ${symbol}:`, error);
    return [];
  }
}

// Get AI analysis
async function getAiAnalysis(symbol: string, signal: 'Buy' | 'Sell', rsi: number, hma8: number, hma21: number, price: number) {
  if (!GEMINI_API_KEY) {
    return {
      signal,
      reasoning: signal === 'Buy' ? 'Bullish HMA crossover' : 'Bearish HMA crossover',
      risk_level: 'Moderate',
      movement_type: 'Organic',
      trading_advice: signal === 'Buy' ? 'Enter long position' : 'Exit long position',
      warning_signs: 'Monitor volume'
    };
  }

  try {
    const prompt = signal === 'Buy'
      ? `You are a crypto analyst. ${symbol} shows a BUY signal with HMA(8)=${hma8.toFixed(4)}, HMA(21)=${hma21.toFixed(4)}, RSI=${rsi.toFixed(2)}, Price=${price}. Return JSON: {"reasoning": "...(max 15 words)", "risk_level": "Low/Moderate/High", "movement_type": "Organic/Manipulation/Mixed", "trading_advice": "...", "warning_signs": "..."}`
      : `You are a crypto analyst. ${symbol} shows a SELL signal. Return JSON: {"reasoning": "...(max 15 words)", "risk_level": "Low/Moderate/High", "movement_type": "Organic/Manipulation/Mixed"}`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        signal,
        ...parsed
      };
    }
  } catch (error) {
    console.error('AI analysis error:', error);
  }

  return {
    signal,
    reasoning: signal === 'Buy' ? 'Bullish signal' : 'Bearish signal',
    risk_level: 'Moderate'
  };
}

// Generate signal for a symbol
async function generateSignalForSymbol(symbol: string, interval: '1m' | '5m' | '15m' | '1h' = '15m') {
  try {
    const klines = await fetchBinanceKlines(symbol, interval);
    if (klines.length < 22) return null;

    const closePrices = klines.map((k: BinanceKline) => parseFloat(k[4]));
    const volumes = klines.map((k: BinanceKline) => parseFloat(k[7]));

    const hma8 = calculateHMA(closePrices, 8);
    const hma21 = calculateHMA(closePrices, 21);
    const rsi7 = calculateRSI(closePrices, 7);

    if (hma8.length < 2 || hma21.length < 2 || rsi7.length < 1) return null;

    const lastHma8 = hma8[hma8.length - 1];
    const prevHma8 = hma8[hma8.length - 2];
    const lastHma21 = hma21[hma21.length - 1];
    const prevHma21 = hma21[hma21.length - 2];
    const lastRsi7 = rsi7[rsi7.length - 1];
    const lastPrice = closePrices[closePrices.length - 1];

    // Volume filter - Must be at least 2.5x average volume (as per pseudo code)
    const avgVolume = volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
    const volumeMultiplier = volumes[volumes.length - 1] / avgVolume;
    if (volumeMultiplier < 2.5) return null; // Minimum 2.5x volume spike

    // Check for BUY signals only (SELL signals don't make sense for pump detection)
    const isBuyTrigger = (prevHma8 <= prevHma21 && lastHma8 > lastHma21 && lastRsi7 < 75) ||
                        (lastHma8 > lastHma21 * 1.001 && lastRsi7 < 40);

    if (!isBuyTrigger) return null;

    const signalType = 'Buy';
    const aiAnalysis = await getAiAnalysis(symbol, signalType, lastRsi7, lastHma8, lastHma21, lastPrice);

    // Insert signal to pump_alerts table (main table)
    const { error: pumpError } = await supabase.from('pump_alerts').insert({
      symbol: symbol.replace('USDT', ''),
      type: 'PUMP_ALERT',
      price: lastPrice,
      price_change: ((lastPrice - closePrices[closePrices.length - 2]) / closePrices[closePrices.length - 2]) * 100,
      volume: volumes[volumes.length - 1],
      avg_volume: avgVolume,
      volume_multiplier: volumes[volumes.length - 1] / avgVolume,
      detected_at: new Date().toISOString(),
      market_state: 'bear_market',
      whale_movement: (volumes[volumes.length - 1] / avgVolume) > 4.0,
      ai_comment: aiAnalysis,
      ai_fetched_at: new Date().toISOString(),
      organic_probability: aiAnalysis?.isOrganic ? 80 : 20,
      risk_analysis: aiAnalysis?.riskAnalysis
    });

    if (pumpError) {
      console.error(`Error inserting pump alert for ${symbol}:`, pumpError);
    }

    // Also insert to signals table for backward compatibility
    const { error: signalError } = await supabase.from('signals').insert({
      symbol: symbol.replace('USDT', ''),
      type: signalType,
      price: lastPrice,
      price_change: ((lastPrice - closePrices[closePrices.length - 2]) / closePrices[closePrices.length - 2]) * 100,
      volume: volumes[volumes.length - 1],
      volume_multiple: volumes[volumes.length - 1] / avgVolume,
      ai_analysis: aiAnalysis
    });

    if (signalError) {
      console.error(`Error inserting signal for ${symbol}:`, signalError);
    }

    console.log(`Signal generated for ${symbol}: ${signalType}`);
    return { symbol, signal: signalType };
  } catch (error) {
    console.error(`Error generating signal for ${symbol}:`, error);
    return null;
  }
}

export const useGenerateSignals = (config: Partial<SignalGenerationConfig> = {}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const generateSignals = async () => {
    if (isGenerating || !finalConfig.enabled) return;

    setIsGenerating(true);
    setProgress({ current: 0, total: 0 });

    try {
      // Get top coins dynamically
      console.log(`Fetching top ${finalConfig.maxCoins} coins by volume...`);
      const topCoins = await getTop200CoinsByVolume();
      const coinsToProcess = topCoins.slice(0, finalConfig.maxCoins).map(coin => coin.symbol);

      console.log(`Starting signal generation for ${coinsToProcess.length} coins using ${finalConfig.interval} interval...`);
      setProgress({ current: 0, total: coinsToProcess.length });

      let signalsGenerated = 0;

      // Process coins sequentially to avoid rate limits
      for (let i = 0; i < coinsToProcess.length; i++) {
        const coin = coinsToProcess[i];
        const result = await generateSignalForSymbol(coin, finalConfig.interval);

        if (result) {
          signalsGenerated++;
        }

        setProgress({ current: i + 1, total: coinsToProcess.length });

        // Small delay between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      console.log(`Signal generation completed: ${signalsGenerated} signals generated from ${coinsToProcess.length} coins`);
      setLastGenerated(new Date());

    } catch (error) {
      console.error('Error in signal generation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    // Auto-generate signals on mount if enabled
    if (finalConfig.enabled) {
      generateSignals();
    }
  }, [finalConfig.enabled]);

  return {
    generateSignals,
    isGenerating,
    progress,
    lastGenerated,
    config: finalConfig
  };
};
