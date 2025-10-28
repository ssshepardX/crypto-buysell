import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Signal } from '@/types/crypto';

export type RiskLevel = 'Low' | 'Moderate' | 'High';

export interface SignalResponse {
  signal: Signal;
  reasoning: string;
  risk?: RiskLevel;
  tp1?: number;
  tp2?: number;
  tp3?: number;
}

const fetchSignalFromFunction = async (symbol: string): Promise<SignalResponse> => {
  const { data, error } = await supabase.functions.invoke('generate-signal', {
    body: { symbol: `${symbol}USDT` },
  });

  if (error) {
    console.error(`Error fetching signal for ${symbol}:`, error);
    return {
      signal: 'Hold',
      reasoning: 'An error occurred while fetching the signal. Please try again later.',
    };
  }
  
  if (data && (data.signal === 'Buy' || data.signal === 'Sell' || data.signal === 'Hold') && data.reasoning) {
    return data;
  }

  return {
    signal: 'Hold',
    reasoning: 'Received an invalid signal format from the analysis engine.',
  };
};

export const useSignalData = (symbol: string) => {
  return useQuery<SignalResponse, Error>({
    queryKey: ['signal', symbol],
    queryFn: () => fetchSignalFromFunction(symbol),
    refetchInterval: 15 * 60 * 1000, 
    staleTime: 5 * 60 * 1000,
  });
};