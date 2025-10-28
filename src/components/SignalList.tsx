import React, { useState, useEffect } from 'react';
import SignalCard from './SignalCard';
import { useBinanceData, fetchBinanceKlines } from '@/hooks/useBinanceData';
import { Skeleton } from './ui/skeleton';
import { useFavorites } from '@/hooks/useFavorites';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RSI, EMA } from 'technicalindicators';

const COIN_NAME_MAP = new Map([
  ['BTC', 'Bitcoin'], ['ETH', 'Ethereum'], ['SOL', 'Solana'], ['XRP', 'XRP'], ['DOGE', 'Dogecoin'],
  ['ADA', 'Cardano'], ['SHIB', 'Shiba Inu'], ['AVAX', 'Avalanche'], ['LINK', 'Chainlink'], ['DOT', 'Polkadot'],
  ['TRX', 'TRON'], ['MATIC', 'Polygon'], ['ICP', 'Internet Computer'], ['BCH', 'Bitcoin Cash'], ['LTC', 'Litecoin'],
  ['NEAR', 'NEAR Protocol'], ['UNI', 'Uniswap'], ['LEO', 'UNUS SED LEO'], ['ETC', 'Ethereum Classic'], ['XLM', 'Stellar'],
  ['OKB', 'OKB'], ['INJ', 'Injective'], ['IMX', 'Immutable'], ['HBAR', 'Hedera'], ['CRO', 'Cronos'],
  ['VET', 'VeChain'], ['TUSD', 'TrueUSD'], ['KAS', 'Kaspa'], ['OP', 'Optimism'], ['TAO', 'Bittensor'],
  ['APT', 'Aptos'], ['LDO', 'Lido DAO'], ['RNDR', 'Render'], ['GRT', 'The Graph'], ['AAVE', 'Aave'],
  ['EGLD', 'MultiversX'], ['STX', 'Stacks'], ['ALGO', 'Algorand'], ['SUI', 'Sui'], ['GALA', 'Gala'],
  ['SAND', 'The Sandbox'], ['MANA', 'Decentraland'], ['AXS', 'Axie Infinity'], ['FTM', 'Fantom'], ['EOS', 'EOS'],
  ['XTZ', 'Tezos'], ['THETA', 'Theta Network'], ['PEPE', 'Pepe'], ['WIF', 'dogwifhat'], ['BONK', 'Bonk'],
  ['BNB', 'BNB'], ['TON', 'Toncoin'], ['FIL', 'Filecoin'], ['MKR', 'Maker'], ['ARB', 'Arbitrum']
]);

const SignalList = () => {
  const { data: liveData, isLoading: isLiveLoading } = useBinanceData();
  const { favorites, toggleFavorite, isLoading: areFavoritesLoading } = useFavorites();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [potentialBuys, setPotentialBuys] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    const performScan = async () => {
      if (!liveData || liveData.length === 0) return;

      setIsScanning(true);
      
      const topCoinsByVolume = liveData
        .filter(t => COIN_NAME_MAP.has(t.symbol.replace('USDT', '')))
        .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
        .slice(0, 150); // Pazarın daha geniş bir kısmını tara

      const klinesPromises = topCoinsByVolume.map(coin => fetchBinanceKlines(coin.symbol));
      const klinesResults = await Promise.all(klinesPromises);

      const candidates = [];
      for (let i = 0; i < topCoinsByVolume.length; i++) {
        const coin = topCoinsByVolume[i];
        const klines = klinesResults[i];

        if (klines.length < 21) continue; // Analiz için yeterli veri yok

        const closePrices = klines.map(k => parseFloat(k[4]));
        
        // Teknik Analiz Ön Filtresi
        const lastRSI = RSI.calculate({ period: 14, values: closePrices }).pop();
        const ema9 = EMA.calculate({ period: 9, values: closePrices }).pop();
        const ema21 = EMA.calculate({ period: 21, values: closePrices }).pop();

        // Alım Sinyali Koşulları:
        // 1. RSI 45'in altında (aşırı alımda değil, yükseliş potansiyeli var)
        // 2. Kısa vadeli EMA, uzun vadeli EMA'yı yukarı kesmiş veya çok yakın (yükseliş trendi başlangıcı)
        if (lastRSI && ema9 && ema21 && lastRSI < 45 && ema9 > ema21) {
          candidates.push({
            ...coin,
            symbol: coin.symbol.replace('USDT', ''),
            name: COIN_NAME_MAP.get(coin.symbol.replace('USDT', '')) || coin.symbol.replace('USDT', ''),
          });
        }
      }
      
      setPotentialBuys(candidates);
      setIsScanning(false);
    };

    performScan();
  }, [liveData]);

  const displayedCoins = showFavoritesOnly
    ? potentialBuys.filter(coin => favorites.includes(coin.symbol))
    : potentialBuys;

  const isLoading = isLiveLoading || areFavoritesLoading || isScanning;

  if (isLoading) {
    return (
      <div>
        <p className="text-center text-muted-foreground mb-4">Scanning market for potential buy signals...</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[280px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center space-x-2 mb-6">
        <Switch
          id="favorites-only"
          checked={showFavoritesOnly}
          onCheckedChange={setShowFavoritesOnly}
        />
        <Label htmlFor="favorites-only">Show Favorites Only ({favorites.length})</Label>
      </div>
      {displayedCoins.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCoins.map((coin) => (
            <SignalCard 
              key={coin.symbol} 
              name={coin.name}
              symbol={coin.symbol}
              price={parseFloat(coin.lastPrice)}
              change24h={parseFloat(coin.priceChangePercent)}
              isFavorite={favorites.includes(coin.symbol)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      ) : (
         <p className="col-span-full text-center text-muted-foreground py-10">
           {showFavoritesOnly 
             ? "No potential buy signals found in your favorites right now."
             : "No strong buy signals detected in the current market scan. The market might be consolidating."
           }
         </p>
      )}
    </div>
  );
};

export default SignalList;