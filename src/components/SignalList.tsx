import React, { useState, useMemo } from 'react';
import SignalCard from './SignalCard';
import { useBinanceData } from '@/hooks/useBinanceData';
import { Skeleton } from './ui/skeleton';
import { useFavorites } from '@/hooks/useFavorites';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Bu liste artık sadece sembollerden isimleri eşlemek için kullanılacak bir harita görevi görecek.
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

  const topCoins = useMemo(() => {
    if (!liveData) return [];
    
    return liveData
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 50)
      .map(ticker => {
        const symbol = ticker.symbol.replace('USDT', '');
        return {
          ...ticker,
          symbol: symbol,
          name: COIN_NAME_MAP.get(symbol) || symbol,
        };
      })
      .filter(coin => COIN_NAME_MAP.has(coin.symbol)); // Sadece ismini bildiğimiz coinleri listele
  }, [liveData]);

  const displayedCoins = showFavoritesOnly
    ? topCoins.filter(coin => favorites.includes(coin.symbol))
    : topCoins;

  if (isLiveLoading || areFavoritesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-[280px] w-full" />
        ))}
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
        <Label htmlFor="favorites-only">Show Favorites Only</Label>
      </div>
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
        {showFavoritesOnly && displayedCoins.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground">You haven't favorited any signals yet. Click the star icon to add one.</p>
        )}
         {displayedCoins.length === 0 && !showFavoritesOnly && (
           <p className="col-span-full text-center text-muted-foreground">Loading trending coins...</p>
         )}
      </div>
    </div>
  );
};

export default SignalList;