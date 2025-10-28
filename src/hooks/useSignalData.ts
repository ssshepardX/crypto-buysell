import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Signal } from '@/types/crypto';

export interface SignalResponse {
  signal: Signal;
  reasoning: string;
}

const fetchSignalFromFunction = async (symbol: string): Promise<SignalResponse> => {
  const { data, error } = await supabase.functions.invoke('generate-signal', {
    body: { symbol: `${symbol}USDT` },
  });

  if (error) {
    console.error(`Error fetching signal for ${symbol}:`, error);
    // Provide a default 'Hold' signal on error to prevent crashes
    return {
      signal: 'Hold',
      reasoning: 'An error occurred while fetching the signal. Please try again later.',
    };
  }
  
  // Ensure the response has the correct shape
  if (data && (data.signal === 'Buy' || data.signal === 'Sell' || data.signal === 'Hold') && data.reasoning) {
    return data;
  }

  // Fallback if the data is malformed
  return {
    signal: 'Hold',
    reasoning: 'Received an invalid signal format from the analysis engine.',
  };
};

export const useSignalData = (symbol: string) => {
  return useQuery<SignalResponse, Error>({
    queryKey: ['signal', symbol],
    queryFn: () => fetchSignalFromFunction(symbol),
    // Refetch signals every 15 minutes
    refetchInterval: 15 * 60 * 1000, 
    // Consider data fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
};