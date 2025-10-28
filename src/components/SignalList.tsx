import React from 'react';
import SignalCard from './SignalCard';
import { useBinanceData } from '@/hooks/useBinanceData';
import { Skeleton } from './ui/skeleton';

// Sinyallerini göstermek istediğimiz kripto paraların listesi
const COIN_LIST = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'PEPE', name: 'Pepe' },
  { symbol: 'ADA', name: 'Cardano' },
];

const SignalList = () => {
  const { data: liveData, isLoading: isLiveLoading } = useBinanceData();

  if (isLiveLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[190px] w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {COIN_LIST.map((coin) => {
        const ticker = liveData?.find(d => d.symbol === `${coin.symbol}USDT`);
        if (!ticker) {
          // Veri bulunamazsa bir iskelet göster
          return <Skeleton key={coin.symbol} className="h-[190px] w-full" />;
        }

        return (
          <SignalCard 
            key={coin.symbol} 
            name={coin.name}
            symbol={coin.symbol}
            price={parseFloat(ticker.lastPrice)}
            change24h={parseFloat(ticker.priceChangePercent)}
          />
        );
      })}
    </div>
  );
};

export default SignalList;