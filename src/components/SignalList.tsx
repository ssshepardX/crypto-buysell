import React from 'react';
import SignalCard from './SignalCard';
import { CryptoSignal } from '@/types/crypto';

const mockSignals: CryptoSignal[] = [
  { id: '1', name: 'Bitcoin', symbol: 'BTC', price: 68450.78, change24h: 2.5, signal: 'Buy' },
  { id: '2', name: 'Ethereum', symbol: 'ETH', price: 3560.12, change24h: -1.2, signal: 'Sell' },
  { id: '3', name: 'Solana', symbol: 'SOL', price: 165.45, change24h: 5.8, signal: 'Buy' },
  { id: '4', name: 'Dogecoin', symbol: 'DOGE', price: 0.158, change24h: 0.5, signal: 'Hold' },
  { id: '5', name: 'Pepe', symbol: 'PEPE', price: 0.00001195, change24h: -8.3, signal: 'Sell' },
  { id: '6', name: 'Cardano', symbol: 'ADA', price: 0.45, change24h: 1.1, signal: 'Hold' },
];

const SignalList = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mockSignals.map((signal) => (
        <SignalCard key={signal.id} data={signal} />
      ))}
    </div>
  );
};

export default SignalList;