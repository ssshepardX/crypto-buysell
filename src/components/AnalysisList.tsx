import React, { useState, useMemo } from 'react';
import AnalysisCard from './AnalysisCard';
import { useBinanceData, BinanceTicker } from '@/hooks/useBinanceData';
import { Skeleton } from './ui/skeleton';
import { useFavorites } from '@/hooks/useFavorites';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePumpAlerts, PumpAlert } from '@/hooks/useSignalData';

interface CoinWithName extends BinanceTicker {
  name: string;
}

interface AnalysisCardWrapperProps {
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

const AnalysisList = () => {
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
    console.error('AnalysisList error:', liveError);
    return <div className="text-red-500">Failed to load analysis</div>;
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
          <AnalysisCardWrapper
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

// Wrapper to fetch analysis for each card and apply filter
const AnalysisCardWrapper = ({ coin, isFavorite, onToggleFavorite }: AnalysisCardWrapperProps) => {
  const { data: analysisData, isLoading: isAnalysisLoading } = usePumpAlerts(coin.symbol);

  // Don't show loading skeletons - only show real analysis results
  if (isAnalysisLoading || !analysisData) {
    return null;
  }

  // Only show AI_ANALYSIS types (completed analyses)
  if (analysisData.type !== 'AI_ANALYSIS') {
    return null;
  }

  return (
    <AnalysisCard
      name={coin.name}
      symbol={coin.symbol}
      price={parseFloat(coin.lastPrice)}
      change24h={parseFloat(coin.priceChangePercent)}
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
      analysisData={analysisData}
    />
  );
};

export default AnalysisList;
