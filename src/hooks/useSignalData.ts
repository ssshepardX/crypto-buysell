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
  return useQuery({
    queryKey: ['signals', symbol],
    queryFn: async () => {
      try {
        if (symbol) {
          const { data, error } = await supabase
            .from('signals')
            .select('*')
            .eq('symbol', symbol)
            .single();

          if (error) {
            console.warn(`Signal fetch error for ${symbol}:`, error.code);
            if (error.code === 'PGRST116' || error.code === 'PGRST001') {
              return null;
            }
            throw error;
          }
          return data;
        }
        return null;
      } catch (error) {
        console.error('useSignalData error:', error);
        throw error;
      }
    },
    staleTime: Infinity,
  });
};