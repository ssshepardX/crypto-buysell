// Risk Scoring Service - Pure math implementation for Market Watcher

export interface CoinData {
  symbol: string;
  priceChangePercent5m: number; // 5 minute price change percentage
  volume: number; // Current volume
  avgVolume: number; // Average volume of last 20 candles
  marketCap: number; // Market cap in USD
  rsi: number; // RSI value
  totalBidsUSD: number; // Total USD value of bids in orderbook
  totalAsksUSD: number; // Total USD value of asks in orderbook
  volumeToMarketCapRatio: number; // Volume / Market Cap ratio
  priceChangePercent1m: number; // 1 minute price change percentage
}

export interface RiskScoreResult {
  symbol: string;
  base_risk_score: number;
  trigger_reason: string;
  technical_data: {
    rsi: number;
    orderbook_ratio: number;
    volume_to_market_cap: number;
    price_change_1m: number;
    price_change_5m: number;
    volume_multipler: number;
  };
}

/**
 * Layer 1: Mechanical Filter (Pre-check)
 * Returns true if coin passes all pre-check conditions
 */
function passesMechanicalFilter(coinData: CoinData): boolean {
  // 1. Price Change (5m) > 2%
  if (coinData.priceChangePercent5m <= 2) {
    return false;
  }

  // 2. Volume > 3x the average of the last 20 candles
  const volumeMultiplier = coinData.volume / coinData.avgVolume;
  if (volumeMultiplier <= 3) {
    return false;
  }

  // 3. Market Cap > $10M
  if (coinData.marketCap <= 10_000_000) {
    return false;
  }

  return true;
}

/**
 * Layer 2: Deterministic Math Scoring
 * Calculate base risk score using mathematical rules
 */
function calculateDeterministicScore(coinData: CoinData): number {
  let score = 0;

  // 1. RSI Check: If RSI > 85, add +20 points (Overbought)
  if (coinData.rsi > 85) {
    score += 20;
  }

  // 2. Orderbook Imbalance: If (Total Bids / Total Asks) < 0.33, add +30 points (No support/Thin orderbook)
  const orderbookRatio = coinData.totalBidsUSD / coinData.totalAsksUSD;
  if (orderbookRatio < 0.33) {
    score += 30;
  }

  // 3. Market Cap Ratio: If (Volume / Market Cap) > 0.2, add +15 points (Overheated)
  if (coinData.volumeToMarketCapRatio > 0.2) {
    score += 15;
  }

  // 4. Panic Buy: If Price Change (1m) > 5%, add +20 points
  if (coinData.priceChangePercent1m > 5) {
    score += 20;
  }

  // 5. Cap the score: Ensure the final score never exceeds 100
  return Math.min(score, 100);
}

/**
 * Core Analysis Logic - 3-Layer Filter Architecture
 * Implements pure mathematical risk scoring without AI
 */
export function calculateBaseRiskScore(coinData: CoinData): RiskScoreResult | null {
  const triggerReasons: string[] = [];

  // Layer 1: Mechanical Filter
  const mechanicalFilterPass = passesMechanicalFilter(coinData);

  if (!mechanicalFilterPass) {
    // Build trigger reasons for failed filters
    if (coinData.priceChangePercent5m <= 2) {
      triggerReasons.push(`5m price change (${coinData.priceChangePercent5m.toFixed(2)}%) <= 2%`);
    }
    if (coinData.volume / coinData.avgVolume <= 3) {
      const multiplier = coinData.volume / coinData.avgVolume;
      triggerReasons.push(`Volume multiplier (${multiplier.toFixed(2)}x) <= 3x`);
    }
    if (coinData.marketCap <= 10_000_000) {
      triggerReasons.push(`Market cap ($${coinData.marketCap.toLocaleString()}) <= $10M`);
    }

    return {
      symbol: coinData.symbol,
      base_risk_score: 0,
      trigger_reason: `Failed mechanical filter: ${triggerReasons.join(', ')}`,
      technical_data: {
        rsi: coinData.rsi,
        orderbook_ratio: coinData.totalBidsUSD / coinData.totalAsksUSD,
        volume_to_market_cap: coinData.volumeToMarketCapRatio,
        price_change_1m: coinData.priceChangePercent1m,
        price_change_5m: coinData.priceChangePercent5m,
        volume_multipler: coinData.volume / coinData.avgVolume
      }
    };
  }

  // Layer 2: Deterministic Math Scoring
  const baseRiskScore = calculateDeterministicScore(coinData);

  // Build trigger reasons for the score
  if (coinData.rsi > 85) {
    triggerReasons.push(`RSI (${coinData.rsi.toFixed(2)}) > 85 (Overbought)`);
  }
  if (coinData.totalBidsUSD / coinData.totalAsksUSD < 0.33) {
    const ratio = coinData.totalBidsUSD / coinData.totalAsksUSD;
    triggerReasons.push(`Orderbook imbalance (${ratio.toFixed(3)}) < 0.33`);
  }
  if (coinData.volumeToMarketCapRatio > 0.2) {
    triggerReasons.push(`Volume/Market Cap (${coinData.volumeToMarketCapRatio.toFixed(3)}) > 0.2 (Overheated)`);
  }
  if (coinData.priceChangePercent1m > 5) {
    triggerReasons.push(`1m price change (${coinData.priceChangePercent1m.toFixed(2)}%) > 5% (Panic buy)`);
  }

  const triggerReason = triggerReasons.length > 0
    ? `Risk factors: ${triggerReasons.join(', ')}`
    : 'Passed mechanical filter with no additional risk factors';

  return {
    symbol: coinData.symbol,
    base_risk_score: baseRiskScore,
    trigger_reason: triggerReason,
    technical_data: {
      rsi: coinData.rsi,
      orderbook_ratio: coinData.totalBidsUSD / coinData.totalAsksUSD,
      volume_to_market_cap: coinData.volumeToMarketCapRatio,
      price_change_1m: coinData.priceChangePercent1m,
      price_change_5m: coinData.priceChangePercent5m,
      volume_multipler: coinData.volume / coinData.avgVolume
    }
  };
}
