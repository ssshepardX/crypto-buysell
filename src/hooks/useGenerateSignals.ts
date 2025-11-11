import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Popular coins to generate signals for
const SIGNAL_COINS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 
  'SOLUSDT', 'DOGEUSDT', 'MATICUSDT', 'LINKUSDT', 'UNIUSDT',
  'AVAXUSDT', 'DOTUSDT', 'NEARUSDT', 'INJUSDT', 'FTMUSDT'
];

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
async function fetchBinanceKlines(symbol: string, interval = '15m', limit = 100) {
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    return await response.json();
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

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY, {
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
async function generateSignalForSymbol(symbol: string) {
  try {
    const klines = await fetchBinanceKlines(symbol);
    if (klines.length < 22) return null;

    const closePrices = klines.map((k: any) => parseFloat(k[4]));
    const volumes = klines.map((k: any) => parseFloat(k[7]));

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

    // Volume filter
    const avgVolume = volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
    if (volumes[volumes.length - 1] < avgVolume * 0.4) return null;

    // Check for signals
    const isBuyTrigger = (prevHma8 <= prevHma21 && lastHma8 > lastHma21 && lastRsi7 < 75) || 
                        (lastHma8 > lastHma21 * 1.001 && lastRsi7 < 40);
    
    const isSellTrigger = (prevHma8 >= prevHma21 && lastHma8 < lastHma21 && lastRsi7 > 25) ||
                         (lastHma8 < lastHma21 * 0.999 && lastRsi7 > 80);

    if (!isBuyTrigger && !isSellTrigger) return null;

    const signalType = isBuyTrigger ? 'Buy' : 'Sell';
    const aiAnalysis = await getAiAnalysis(symbol, signalType, lastRsi7, lastHma8, lastHma21, lastPrice);

    // Insert signal to database
    const { error } = await supabase.from('signals').insert({
      symbol: symbol.replace('USDT', ''),
      type: signalType,
      price: lastPrice,
      price_change: ((lastPrice - closePrices[closePrices.length - 2]) / closePrices[closePrices.length - 2]) * 100,
      volume: volumes[volumes.length - 1],
      volume_multiple: volumes[volumes.length - 1] / avgVolume,
      ai_analysis: aiAnalysis
    });

    if (error) {
      console.error(`Error inserting signal for ${symbol}:`, error);
      return null;
    }

    console.log(`Signal generated for ${symbol}: ${signalType}`);
    return { symbol, signal: signalType };
  } catch (error) {
    console.error(`Error generating signal for ${symbol}:`, error);
    return null;
  }
}

export const useGenerateSignals = () => {
  useEffect(() => {
    // Generate signals on component mount
    const generateAllSignals = async () => {
      console.log('Starting signal generation for', SIGNAL_COINS.length, 'coins...');
      
      // Process coins sequentially to avoid rate limits
      for (const coin of SIGNAL_COINS) {
        await generateSignalForSymbol(coin);
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log('Signal generation completed');
    };

    generateAllSignals();
  }, []);
};
