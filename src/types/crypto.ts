export type Signal = 'Buy' | 'Sell' | 'Hold';

export interface CryptoSignal {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  signal: Signal;
}