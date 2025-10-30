import React from 'react';
import { useBinanceData } from '@/hooks/useBinanceData';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';


const TRENDING_COINS = ['DOGEUSDT', 'SHIBUSDT', 'PEPEUSDT', 'WIFUSDT', 'BONKUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT', 'MATICUSDT'];

const TrendingCoinCard = ({ symbol, price, change }: { symbol: string; price: string; change: number }) => {
  const isPositive = change >= 0;
  const formattedPrice = parseFloat(price);
  
  return (
    <Card className="bg-secondary/50 backdrop-blur-sm border-white/10 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-[0_0_25px_theme(colors.purple.500/50%)]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <span className="font-bold text-lg">{symbol.replace('USDT', '')}</span>
        <span className={`flex items-center text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          {change.toFixed(2)}%
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          ${formattedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: formattedPrice > 1 ? 2 : 8 })}
        </div>
      </CardContent>
    </Card>
  );
};

const TrendingCoins = () => {
  const { data, isLoading } = useBinanceData();

  const trendingData = data
    ? TRENDING_COINS.map(coinSymbol => data.find(d => d.symbol === coinSymbol)).filter(Boolean)
    : [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {trendingData.map(item => (
        <TrendingCoinCard key={item!.symbol} symbol={item!.symbol} price={item!.lastPrice} change={parseFloat(item!.priceChangePercent)} />
      ))}
    </div>
  );
};

export default TrendingCoins;