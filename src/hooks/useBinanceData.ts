import { useQuery } from '@tanstack/react-query';

export interface BinanceTicker {
  symbol: string;
  priceChangePercent: string;
  lastPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
}

const fetchBinanceData = async (): Promise<BinanceTicker[]> => {
  const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data: BinanceTicker[] = await response.json();
  return data.filter(ticker => ticker.symbol.endsWith('USDT'));
};

export const useBinanceData = () => {
  return useQuery({
    queryKey: ['binanceData'],
    queryFn: fetchBinanceData,
    staleTime: Infinity,
  });
};

// Belirli bir sembol için geçmiş mum verilerini çeken yardımcı fonksiyon
export const fetchBinanceKlines = async (symbol: string, interval = '1h', limit = 100) => {
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
      // Binance'in rate limitlerini veya bulunamayan sembolleri sessizce geç
      // console.warn(`Could not fetch klines for ${symbol}: ${response.statusText}`);
      return [];
    }
    return await response.json();
  } catch (error) {
    // console.error(`Error fetching klines for ${symbol}:`, error);
    return [];
  }
};