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

export interface MarketWatcherConfig {
  maxCoins: number;
  interval: '1m'; // Fixed to 1m for real-time anomaly detection
  enabled: boolean;
  volumeMultiplier: number; // 2.5 - Anomaly trigger
  priceChangeThreshold: number; // 0.03 - 3% anomaly trigger
  aiEnabled: boolean;
  scanInterval: number; // 60 seconds for continuous monitoring
  autoScan?: boolean;
}

const DEFAULT_CONFIG: MarketWatcherConfig = {
  maxCoins: 200,
  interval: '1m',
  enabled: true,
  volumeMultiplier: 2.5,
  priceChangeThreshold: 0.03, // 3%
  aiEnabled: true,
  scanInterval: 60 * 1000 // 60 seconds
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

// Fetch 24h ticker data
async function fetch24hTicker(symbol: string) {
  try {
    const formattedSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${formattedSymbol}`;

    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error fetching 24h ticker for ${symbol}:`, error);
    return null;
  }
}

// Fetch orderbook depth
async function fetchOrderBookDepth(symbol: string, limit = 100) {
  try {
    const formattedSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
    const url = `https://api.binance.com/api/v3/depth?symbol=${formattedSymbol}&limit=${limit}`;

    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();

    // Calculate total depth (sum of bids and asks)
    const totalDepth = [...data.bids, ...data.asks].reduce((sum, [price, quantity]) =>
      sum + (parseFloat(price) * parseFloat(quantity)), 0);

    return totalDepth;
  } catch (error) {
    console.error(`Error fetching orderbook for ${symbol}:`, error);
    return null;
  }
}

// Fetch market cap from CoinGecko (simplified)
async function fetchMarketCap(symbol: string) {
  try {
    const coinId = symbol.replace('USDT', '').toLowerCase();
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_market_cap=true`;

    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();

    return data[coinId]?.usd_market_cap || null;
  } catch (error) {
    console.error(`Error fetching market cap for ${symbol}:`, error);
    return null;
  }
}

// Get orderbook depth in price range
async function getOrderbookDepth(symbol: string, percentRange = 2.0) {
  try {
    const formattedSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
    const url = `https://api.binance.com/api/v3/depth?symbol=${formattedSymbol}&limit=100`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const currentPrice = await getCurrentPrice(symbol);
    if (!currentPrice) return null;

    const minPrice = currentPrice * (1 - percentRange / 100);
    const maxPrice = currentPrice * (1 + percentRange / 100);

    // Filter orders within price range
    const bidsInRange = data.bids.filter(([price]: [string, string]) =>
      parseFloat(price) >= minPrice && parseFloat(price) <= maxPrice
    );
    const asksInRange = data.asks.filter(([price]: [string, string]) =>
      parseFloat(price) >= minPrice && parseFloat(price) <= maxPrice
    );

    // Calculate total USD value
    const totalBidsUsd = bidsInRange.reduce((sum: number, [price, quantity]: [string, string]) =>
      sum + (parseFloat(price) * parseFloat(quantity)), 0);
    const totalAsksUsd = asksInRange.reduce((sum: number, [price, quantity]: [string, string]) =>
      sum + (parseFloat(price) * parseFloat(quantity)), 0);
    const depthUsd = totalBidsUsd + totalAsksUsd;

    return {
      total_bids_usd: totalBidsUsd,
      total_asks_usd: totalAsksUsd,
      depth_usd: depthUsd,
      is_thin: depthUsd < 1300000 // 1.3M USD threshold
    };
  } catch (error) {
    console.error(`Error fetching orderbook depth for ${symbol}:`, error);
    return null;
  }
}

// Get current price
async function getCurrentPrice(symbol: string) {
  try {
    const formattedSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
    const url = `https://api.binance.com/api/v3/ticker/price?symbol=${formattedSymbol}`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error(`Error fetching current price for ${symbol}:`, error);
    return null;
  }
}

// Get social mentions (placeholder - would need Twitter API)
async function getSocialMentions(symbol: string, timeframe = '10m') {
  // Placeholder implementation - in real app would connect to Twitter/LunarCrush API
  return {
    mention_increase_percent: 0, // Simulated
    sentiment: 'neutral'
  };
}

// Get average volume for last N candles
async function getAvgVolume(symbol: string, periods = 20) {
  try {
    const klines = await fetchBinanceKlines(symbol, '1m', periods + 1);
    if (klines.length < periods) return 0;

    const volumes = klines.slice(-periods).map((k: BinanceKline) => parseFloat(k[7]));
    return volumes.reduce((sum, vol) => sum + vol, 0) / periods;
  } catch (error) {
    console.error(`Error fetching avg volume for ${symbol}:`, error);
    return 0;
  }
}

// Get structured AI analysis for anomaly
async function getGeminiStructuredAnalysis(
  symbol: string,
  priceChange: number,
  volumeSpike: number,
  orderbookData: { total_bids_usd: number; total_asks_usd: number; depth_usd: number; is_thin: boolean } | null,
  socialData: { mention_increase_percent: number; sentiment: string }
) {
  if (!GEMINI_API_KEY) {
    return {
      risk_score: 50,
      summary: 'AI analysis unavailable - potential anomaly detected',
      likely_source: 'Unknown',
      actionable_insight: 'Monitor the price movement closely'
    };
  }

  try {
    const prompt = `GÖREV: Sen bir kripto para piyasası anomali analistisin.
Sana verilen verileri analiz et ve bir 'Pump & Dump' veya manipülasyon riskini değerlendir.

VERİLER:
- Coin: $${symbol.replace('USDT', '')}USDT
- Son 1dk Fiyat Değişimi: +${priceChange.toFixed(2)}%
- Hacim Artışı (Ortalamaya Göre): ${volumeSpike.toFixed(1)}x
- Emir Defteri (+/- %2): ${orderbookData?.depth_usd ? (orderbookData.depth_usd / 1000000).toFixed(1) + 'M' : 'Unknown'} USD (${orderbookData?.is_thin ? 'ZAYIF' : 'GÜÇLÜ'})
- Sosyal Medya (Son 10dk): ${socialData?.mention_increase_percent || 0}% artış

ANALİZ İSTEĞİ:
Bu verilere dayanarak, aşağıdaki JSON formatında bir risk analizi oluştur:

{
  "risk_score": (0-100 arası bir manipülasyon/tuzak riski puanı),
  "summary": (1-2 cümlelik, yatırımcı dostu özet ve sonuç. Örn: 'Yüksek Risk: ...'),
  "likely_source": ('Organik Alım', 'Balina Operasyonu', 'Pump Grubu / Söylenti', 'Short Squeeze', 'Bilinmiyor'),
  "actionable_insight": (Yatırımcıya 1 cümlelik eyleme dönük fikir. Örn: 'FOMO'dan kaçının', 'Hareketi izlemeye alın')
}

Sadece JSON çıktısı ver. Başka hiçbir açıklama yapma.`;

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
      return parsed;
    }
  } catch (error) {
    console.error('AI analysis error:', error);
  }

  return {
    risk_score: 50,
    summary: 'Analysis failed - monitor the anomaly',
    likely_source: 'Unknown',
    actionable_insight: 'Exercise caution with this movement'
  };
}

// Analyze coin for anomalies (new main logic)
async function analyzeCoinAnomaly(symbol: string, config: MarketWatcherConfig) {
  try {
    // 3.1 Temel Veri Toplama
    const priceData = await fetchBinanceKlines(symbol, '1m', 2); // Son 2 mum
    if (!priceData || priceData.length < 2) return null;

    const avgVolume = await getAvgVolume(symbol, 20);
    const priceChange = ((parseFloat(priceData[1][4]) - parseFloat(priceData[0][4])) / parseFloat(priceData[0][4])) * 100;
    const volumeSpike = parseFloat(priceData[1][7]) / avgVolume;

    // 3.2 ANOMALİ TETİKLEYİCİSİ
    if (priceChange <= config.priceChangeThreshold || volumeSpike <= config.volumeMultiplier) {
      return null; // Anomali yok, devam et
    }

    // PİVOT NOKTASI 1: VERİ ZENGİNLEŞTİRME
    const [orderbookData, socialData] = await Promise.all([
      getOrderbookDepth(symbol, 2.0), // +/- %2
      getSocialMentions(symbol, '10m')
    ]);

    // 3.3 AKILLI ANALİZ
    if (config.aiEnabled) {
      const aiAnalysisResult = await getGeminiStructuredAnalysis(
        symbol,
        priceChange,
        volumeSpike,
        orderbookData,
        socialData
      );

      // PİVOT NOKTASI 2: DEPOLAMA VE BİLDİRİM
      // Artık "PUMP_ALERT" değil, "AI_ANALYSIS" kaydediyoruz
      const { error: analysisError } = await supabase.from('pump_alerts').insert({
        symbol: symbol.replace('USDT', ''),
        type: 'AI_ANALYSIS', // Changed from PUMP_ALERT
        price: parseFloat(priceData[1][4]),
        price_change: priceChange,
        volume: parseFloat(priceData[1][7]),
        avg_volume: avgVolume,
        volume_multiplier: volumeSpike,
        detected_at: new Date().toISOString(),
        market_state: 'bear_market',
        orderbook_depth: orderbookData?.depth_usd || null,
        ai_comment: aiAnalysisResult,
        ai_fetched_at: new Date().toISOString(),
        risk_score: aiAnalysisResult.risk_score,
        likely_source: aiAnalysisResult.likely_source,
        actionable_insight: aiAnalysisResult.actionable_insight
      });

      if (analysisError) {
        console.error(`Error saving AI analysis for ${symbol}:`, analysisError);
        return null;
      }

      // b) Akıllı Bildirim Gönder
      const notificationTitle = `⚠️ $${symbol.replace('USDT', '')}USDT Yüksek Risk Uyarısı (Skor: ${aiAnalysisResult.risk_score})`;
      const notificationBody = aiAnalysisResult.summary;

      console.log(`AI Analysis completed for ${symbol}: Risk Score ${aiAnalysisResult.risk_score}`);
      console.log(`Notification: ${notificationTitle}`);
      console.log(`Summary: ${notificationBody}`);

      return {
        symbol,
        risk_score: aiAnalysisResult.risk_score,
        analysis: aiAnalysisResult
      };
    } else {
      // AI kapalıysa basit sinyal gönder
      const { error: signalError } = await supabase.from('pump_alerts').insert({
        symbol: symbol.replace('USDT', ''),
        type: 'BASIC_ANOMALY',
        price: parseFloat(priceData[1][4]),
        price_change: priceChange,
        volume: parseFloat(priceData[1][7]),
        avg_volume: avgVolume,
        volume_multiplier: volumeSpike,
        detected_at: new Date().toISOString(),
        market_state: 'bear_market'
      });

      if (signalError) {
        console.error(`Error saving basic anomaly for ${symbol}:`, signalError);
        return null;
      }

      console.log(`Basic anomaly detected for ${symbol}: ${priceChange.toFixed(2)}% price change, ${volumeSpike.toFixed(1)}x volume`);
      return { symbol, basic: true };
    }
  } catch (error) {
    console.error(`Error analyzing ${symbol}:`, error);
    return null;
  }
}

export const useGenerateSignals = (config: Partial<MarketWatcherConfig> = {}) => {
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
        const result = await analyzeCoinAnomaly(coin, finalConfig);

        if (result) {
          signalsGenerated++;
        }

        setProgress({ current: i + 1, total: coinsToProcess.length });

        // Small delay between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay for 1m scans
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

    // Set up auto scan interval if enabled
    let intervalId: NodeJS.Timeout | null = null;
    if (finalConfig.enabled && finalConfig.autoScan && finalConfig.scanInterval) {
      intervalId = setInterval(() => {
        console.log('Auto scan: Generating signals...');
        generateSignals();
      }, finalConfig.scanInterval);
    }

    // Cleanup interval on unmount or config change
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [finalConfig.enabled, finalConfig.autoScan, finalConfig.scanInterval]);

  return {
    generateSignals,
    isGenerating,
    progress,
    lastGenerated,
    config: finalConfig
  };
};
