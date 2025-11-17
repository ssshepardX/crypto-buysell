// PROSESS 1: MARKET WATCHER (Piyasa Gözetmeni)
// Görevi: ÇOK HIZLI çalış, anormallikleri tespit et, "iş emri" oluştur.
// AI'ı ASLA BEKLEMEZ.
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTop200CoinsByVolume } from '@/services/binanceService';
import { aiWorkerService } from '@/services/aiWorkerService';
import { notificationService } from '@/services/notificationService';

export interface MarketWatcherConfig {
  maxCoins: number;
  interval: '1m';
  enabled: boolean;
  volumeMultiplier: number;
  priceChangeThreshold: number;
  aiEnabled: boolean;
  scanInterval: number;
  autoScan?: boolean;
}

const DEFAULT_CONFIG: MarketWatcherConfig = {
  maxCoins: 10,
  interval: '1m',
  enabled: true,
  volumeMultiplier: 2.5,
  priceChangeThreshold: 0.03,
  aiEnabled: true,
  scanInterval: 60 * 1000
};

// Global parametreler
const COINS = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'SHIB', 'AVAX', 'LINK', 'DOT'];
const INTERVAL = '1m';
const VOLUME_MULTIPLIER = 2.5;
const PRICE_CHANGE_THRESHOLD = 0.03;
const CACHE_DURATION_MINUTES = 15;

type BinanceKline = [
  number, string, string, string, string, string, number, string, number, string, string, string
];

// Temel veri toplama
async function getBinanceKline(symbol: string, interval: string): Promise<BinanceKline | null> {
  try {
    const formattedSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
    const url = `https://api.binance.com/api/v3/klines?symbol=${formattedSymbol}&interval=${interval}&limit=1`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    return data[0] as BinanceKline;
  } catch (error) {
    console.error(`getBinanceKline error for ${symbol}:`, error);
    return null;
  }
}

// Ortalama hacim hesaplama
async function getAvgVolume(symbol: string, periods: number): Promise<number> {
  try {
    const formattedSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
    const url = `https://api.binance.com/api/v3/klines?symbol=${formattedSymbol}&interval=1m&limit=${periods}`;

    const response = await fetch(url);
    if (!response.ok) return 0;

    const data = await response.json();
    const volumes = data.map((k: BinanceKline) => parseFloat(k[7]));
    return volumes.reduce((sum: number, vol: number) => sum + vol, 0) / periods;
  } catch (error) {
    console.error(`getAvgVolume error for ${symbol}:`, error);
    return 0;
  }
}

// Fiyat değişimi hesaplama
function calculatePercentChange(close: string, open: string): number {
  const closePrice = parseFloat(close);
  const openPrice = parseFloat(open);
  return ((closePrice - openPrice) / openPrice) * 100;
}

// Emir defteri derinliği
async function getOrderbookDepth(symbol: string, percentRange: number) {
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

    const bidsInRange = data.bids.filter(([price]: [string, string]) =>
      parseFloat(price) >= minPrice && parseFloat(price) <= maxPrice
    );
    const asksInRange = data.asks.filter(([price]: [string, string]) =>
      parseFloat(price) >= minPrice && parseFloat(price) <= maxPrice
    );

    const totalBidsUsd = bidsInRange.reduce((sum: number, [price, quantity]: [string, string]) =>
      sum + (parseFloat(price) * parseFloat(quantity)), 0);
    const totalAsksUsd = asksInRange.reduce((sum: number, [price, quantity]: [string, string]) =>
      sum + (parseFloat(price) * parseFloat(quantity)), 0);
    const depthUsd = totalBidsUsd + totalAsksUsd;

    return {
      total_bids_usd: totalBidsUsd,
      total_asks_usd: totalAsksUsd,
      depth_usd: depthUsd,
      is_thin: depthUsd < 1300000
    };
  } catch (error) {
    console.error(`getOrderbookDepth error for ${symbol}:`, error);
    return null;
  }
}

// Mevcut fiyat
async function getCurrentPrice(symbol: string): Promise<number | null> {
  try {
    const formattedSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
    const url = `https://api.binance.com/api/v3/ticker/price?symbol=${formattedSymbol}`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error(`getCurrentPrice error for ${symbol}:`, error);
    return null;
  }
}

// Sosyal medya verileri (placeholder)
async function getSocialMentions(symbol: string, timeframe: string) {
  return {
    mention_increase_percent: 0,
    sentiment: 'neutral'
  };
}

// Önbellek kontrolü
async function findRecentJob(symbol: string, minutes: number): Promise<boolean> {
  try {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('analysis_jobs')
      .select('id')
      .eq('symbol', symbol.replace('USDT', ''))
      .gte('created_at', cutoffTime)
      .limit(1);

    if (error) {
      console.error('findRecentJob error:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('findRecentJob error:', error);
    return false;
  }
}

// İş emri oluşturma
async function createAnalysisJob(
  symbol: string,
  priceChange: number,
  volumeSpike: number,
  orderbookData: {
    total_bids_usd: number;
    total_asks_usd: number;
    depth_usd: number;
    is_thin: boolean;
  } | null,
  socialData: {
    mention_increase_percent: number;
    sentiment: string;
  },
  price: number
) {
  try {
    const { data, error } = await supabase
      .from('analysis_jobs')
      .insert({
        symbol: symbol.replace('USDT', ''),
        status: 'PENDING',
        price_at_detection: price,
        price_change: priceChange,
        volume_spike: volumeSpike,
        orderbook_json: JSON.stringify(orderbookData),
        social_json: JSON.stringify(socialData),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error(`createAnalysisJob error for ${symbol}:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`createAnalysisJob error for ${symbol}:`, error);
    return null;
  }
}

// Ana piyasa gözetmeni fonksiyonu
async function startMarketWatcher(config: MarketWatcherConfig) {
  console.log("Piyasa Gözetmeni Başlatıldı...");

  while (true) {
    try {
      const topCoins = await getTop200CoinsByVolume();
      const coinsToProcess = topCoins.slice(0, config.maxCoins).map(coin => coin.symbol);

      for (const coin of coinsToProcess) {
        try {
          // 3.1 Temel Veri Toplama
          const priceData = await getBinanceKline(coin, config.interval);
          if (!priceData) continue;

          const avgVolume = await getAvgVolume(coin, 20);
          if (avgVolume === 0) continue;

          const priceChange = calculatePercentChange(priceData[4], priceData[1]);
          const volumeSpike = parseFloat(priceData[7]) / avgVolume;

          // 3.2 ANOMALİ TESPİTİ
          if (priceChange > config.priceChangeThreshold && volumeSpike > config.volumeMultiplier) {
            // 3.3 GÜVENİRLİK ve MALİYET KONTROLÜ
            if (await findRecentJob(coin, CACHE_DURATION_MINUTES)) {
              continue; // Önbellekte var, atla
            }

            console.log(`🚨 Anomali tespit edildi: ${coin}`);

            // 3.4 HIZLI Veri Zenginleştirme
            const [orderbookData, socialData] = await Promise.all([
              getOrderbookDepth(coin, 2.0),
              getSocialMentions(coin, "10m")
            ]);

            // 3.5 AI İŞ EMRİ OLUŞTUR
            await createAnalysisJob(
              coin,
              priceChange,
              volumeSpike,
              orderbookData,
              socialData,
              parseFloat(priceData[4])
            );
          }
        } catch (error) {
          console.error(`${coin} için Gözetmen hatası:`, error);
        }
      }

      // Tüm coinler tarandı, 60 saniye bekle
      console.log(`${coinsToProcess.length} coin tarandı. 60 saniye bekleniyor...`);
      await new Promise(resolve => setTimeout(resolve, config.scanInterval));

    } catch (error) {
      console.error("Market Watcher döngü hatası:", error);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Hata durumunda 5 saniye bekle
    }
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
      await startMarketWatcher(finalConfig);
    } catch (error) {
      console.error('generateSignals error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    // Initialize notification service
    notificationService.requestPermission().then(granted => {
      if (granted) {
        console.log('✅ Bildirim izinleri alındı');
      }
    });

    // Start AI worker service if AI is enabled
    if (finalConfig.aiEnabled) {
      console.log('🤖 AI Agent Worker başlatılıyor...');
      aiWorkerService.start(5000);
    }

    // Auto-generate signals on mount if enabled
    if (finalConfig.enabled) {
      console.log('🎬 Piyasa Gözetmeni başlatılıyor...');
      generateSignals();
    }

    // Cleanup
    return () => {
      if (finalConfig.aiEnabled) {
        aiWorkerService.stop();
      }
    };
  }, [finalConfig.enabled, finalConfig.aiEnabled]);

  return {
    generateSignals,
    isGenerating,
    progress,
    lastGenerated,
    config: finalConfig
  };
};
