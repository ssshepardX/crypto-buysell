import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Signal {
  id: string;
  symbol: string;
  type: string; // 'Buy', 'Sell', 'Hold'
  price: number;
  price_change: number;
  volume: number;
  volume_multiple: number;
  time: string;
  ai_analysis?: {
    movement_type: 'Organic' | 'Manipulation' | 'Mixed';
    risk_level: 'Low' | 'Medium' | 'High';
    trading_advice: string;
    warning_signs: string;
  };
}

export const useSignalData = (symbol?: string) => {
  return useQuery<Signal | Signal[] | null>({
    queryKey: ['signals', symbol],
    queryFn: async () => {
      // If symbol is provided, fetch signal for that specific coin
      if (symbol) {
        const { data, error } = await supabase
          .from('signals')
          .select('*')
          .eq('symbol', symbol)
          .single();

        if (error) {
          // If no signal found, return null instead of throwing
          if (error.code === 'PGRST116') {
            return null;
          }
          throw error;
        }
        return data;
      }

      // If no symbol, fetch all signals
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .order('time', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
};