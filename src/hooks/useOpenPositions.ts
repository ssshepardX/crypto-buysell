import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const fetchOpenPositions = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('signals_log')
    .select('symbol')
    .eq('signal_type', 'Buy')
    .eq('status', 'open');

  if (error) {
    console.error("Error fetching open positions:", error);
    throw new Error(error.message);
  }
  
  // Return a unique list of symbols for open positions
  const symbols = data.map(pos => pos.symbol);
  return [...new Set(symbols)];
};

export const useOpenPositions = () => {
  return useQuery<string[], Error>({
    queryKey: ['openPositions'],
    queryFn: fetchOpenPositions,
    // Refetch frequently to get updates on open/closed positions
    refetchInterval: 60 * 1000, // every minute
  });
};