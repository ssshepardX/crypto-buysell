import React, { useState } from 'react';
import SignalCard from './SignalCard';
import { useBinanceData } from '@/hooks/useBinanceData';
import { Skeleton } from './ui/skeleton';
import { useFavorites } from '@/hooks/useFavorites';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Tarama yapılacak coin listesini genişletiyoruz
const COIN_LIST = [
  { symbol: 'BTC', name: 'Bitcoin' }, { symbol: 'ETH', name: 'Ethereum' }, { symbol: 'SOL', name: 'Solana' },
  { symbol: 'XRP', name: 'XRP' }, { symbol: 'DOGE', name: 'Dogecoin' }, { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'SHIB', name: 'Shiba Inu' }, { symbol: 'AVAX', name: 'Avalanche' }, { symbol: 'LINK', name: 'Chainlink' },
  { symbol: 'DOT', name: 'Polkadot' }, { symbol: 'TRX', name: 'TRON' }, { symbol: 'MATIC', name: 'Polygon' },
  { symbol: 'ICP', name: 'Internet Computer' }, { symbol: 'BCH', name: 'Bitcoin Cash' }, { symbol: 'LTC', name: 'Litecoin' },
  { symbol: 'NEAR', name: 'NEAR Protocol' }, { symbol: 'UNI', name: 'Uniswap' }, { symbol: 'LEO', name: 'UNUS SED LEO' },
  { symbol: 'ETC', name: 'Ethereum Classic' }, { symbol: 'XLM', name: 'Stellar' }, { symbol: 'OKB', name: 'OKB' },
  { symbol: 'INJ', name: 'Injective' }, { symbol: 'IMX', name: 'Immutable' }, { symbol: 'HBAR', name: 'Hedera' },
  { symbol: 'CRO', name: 'Cronos' }, { symbol: 'VET', name: 'VeChain' }, { symbol: 'TUSD', name: 'TrueUSD' },
  { symbol: 'KAS', name: 'Kaspa' }, { symbol: 'OP', name: 'Optimism' }, { symbol: 'TAO', name: 'Bittensor' },
  { symbol: 'APT', name: 'Aptos' }, { symbol: 'LDO', name: 'Lido DAO' }, { symbol: 'RNDR', name: 'Render' },
  { symbol: 'GRT', name: 'The Graph' }, { symbol: 'AAVE', name: 'Aave' }, { symbol: 'EGLD', name: 'MultiversX' },
  { symbol: 'STX', name: 'Stacks' }, { symbol: 'ALGO', name: 'Algorand' }, { symbol: 'SUI', name: 'Sui' },
  { symbol: 'GALA', name: 'Gala' }, { symbol: 'SAND', name: 'The Sandbox' }, { symbol: 'MANA', name: 'Decentraland' },
  { symbol: 'AXS', name: 'Axie Infinity' }, { symbol: 'FTM', name: 'Fantom' }, { symbol: 'EOS', name: 'EOS' },
  { symbol: 'XTZ', name: 'Tezos' }, { symbol: 'THETA', name: 'Theta Network' }, { symbol: 'PEPE', name: 'Pepe' },
  { symbol: 'WIF', name: 'dogwifhat' }, { symbol: 'BONK', name: 'Bonk' }
];

const SignalList = () => {
  const { data: liveData, isLoading: isLiveLoading } = useBinanceData();
  const { favorites, toggleFavorite, isLoading: areFavoritesLoading } = useFavorites();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filteredCoins = showFavoritesOnly
    ? COIN_LIST.filter(coin => favorites.includes(coin.symbol))
    : COIN_LIST;

  if (isLiveLoading || areFavoritesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-[240px] w-full" />
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
        {filteredCoins.map((coin) => {
          const ticker = liveData?.find(d => d.symbol === `${coin.symbol}USDT`);
          if (!ticker) {
            return null; // Veya bir iskelet gösterilebilir
          }

          return (
            <SignalCard 
              key={coin.symbol} 
              name={coin.name}
              symbol={coin.symbol}
              price={parseFloat(ticker.lastPrice)}
              change24h={parseFloat(ticker.priceChangePercent)}
              isFavorite={favorites.includes(coin.symbol)}
              onToggleFavorite={toggleFavorite}
            />
          );
        })}
        {showFavoritesOnly && filteredCoins.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground">You haven't favorited any signals yet. Click the star icon to add one.</p>
        )}
      </div>
    </div>
  );
};

export default SignalList;