import { useQuery } from '@tanstack/react-query';

export interface BinanceTicker {
  symbol: string;
  priceChangePercent: string;
  lastPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string; // Added for sorting by trading volume
}

const fetchBinanceData = async (): Promise<BinanceTicker[]> => {
  const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data: BinanceTicker[] = await response.json();
  // Sadece USDT paritelerini filtrele
  return data.filter(ticker => ticker.symbol.endsWith('USDT'));
};

export const useBinanceData = () => {
  return useQuery<BinanceTicker[], Error>({
    queryKey: ['binanceData'],
    queryFn: fetchBinanceData,
    refetchInterval: 5000, // Verileri her 5 saniyede bir yenile
  });
};