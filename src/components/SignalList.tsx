import React, { useState, useMemo } from 'react';
import SignalCard from './SignalCard';
import { useBinanceData, BinanceTicker } from '@/hooks/useBinanceData';
import { Skeleton } from './ui/skeleton';
import { useFavorites } from '@/hooks/useFavorites';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePumpAlerts, PumpAlert } from '@/hooks/useSignalData';
import { useOpenPositions } from '@/hooks/useOpenPositions';

interface CoinWithName extends BinanceTicker {
  name: string;
}

interface SignalCardWrapperProps {
  coin: CoinWithName;
  isFavorite: boolean;
  onToggleFavorite: (symbol: string) => void;
}

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
  const { data: liveData, isLoading: isLiveLoading, error: liveError } = useBinanceData();
  const { favorites, toggleFavorite, isLoading: areFavoritesLoading } = useFavorites();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const top200Coins = useMemo(() => {
    if (!liveData) return [];
    return liveData
      .filter(t => COIN_NAME_MAP.has(t.symbol.replace('USDT', '')))
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 200)
      .map(coin => ({
        ...coin,
        symbol: coin.symbol.replace('USDT', ''),
        name: COIN_NAME_MAP.get(coin.symbol.replace('USDT', '')) || coin.symbol.replace('USDT', ''),
      }));
  }, [liveData]);

  const filteredCoins = useMemo(() => {
    return showFavoritesOnly
      ? top200Coins.filter(coin => favorites.includes(coin.symbol))
      : top200Coins;
  }, [top200Coins, showFavoritesOnly, favorites]);

  const isLoading = isLiveLoading || areFavoritesLoading;

  if (liveError) {
    console.error('SignalList error:', liveError);
    return <div className="text-red-500">Failed to load signals</div>;
  }

  if (isLoading) {
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-[280px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="favorites-only"
            checked={showFavoritesOnly}
            onCheckedChange={setShowFavoritesOnly}
          />
          <Label htmlFor="favorites-only">Show Favorites Only ({favorites.length})</Label>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCoins.map((coin) => (
          <SignalCardWrapper 
            key={coin.symbol}
            coin={coin}
            isFavorite={favorites.includes(coin.symbol)}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </div>
    </div>
  );
};

// Wrapper to fetch signal for each card and apply filter
const SignalCardWrapper = ({ coin, isFavorite, onToggleFavorite }: SignalCardWrapperProps) => {
  const { data: signalData, isLoading: isSignalLoading } = usePumpAlerts(coin.symbol);
  const { data: openPositions = [], isLoading: isOpenPositionsLoading } = useOpenPositions();

  const isLoading = isSignalLoading || isOpenPositionsLoading;

  if (isLoading) {
    return <Skeleton className="h-[280px] w-full" />;
  }

  // Type guard: ensure signalData is not null
  if (!signalData) {
    return null;
  }

  // Show all "Buy" signals
  const isBuySignal = signalData.type === 'Buy';
  // Only show "Sell" signals if there's an open position for that symbol
  const isSellSignal = signalData.type === 'Sell' && openPositions.includes(coin.symbol);
  // Don't show "Hold" or other signals
  const shouldShow = isBuySignal || isSellSignal;

  if (!shouldShow) {
    return null;
  }

  return (
    <SignalCard 
      name={coin.name}
      symbol={coin.symbol}
      price={parseFloat(coin.lastPrice)}
      change24h={parseFloat(coin.priceChangePercent)}
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
      signalData={signalData}
    />
  );
};

export default SignalList;
