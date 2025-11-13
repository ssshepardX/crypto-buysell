import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PumpAlert {
  id: string;
  symbol: string;
  type: string; // 'PUMP_ALERT'
  price: number;
  price_change: number;
  volume: number;
  avg_volume: number;
  volume_multiplier: number;
  detected_at: string;
  ai_comment?: {
    isOrganic: boolean;
    whaleMovementProbability: number;
    riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
    riskAnalysis: string;
    tradingAdvice: string;
    warningSignals: string[];
    marketState: string;
  };
  ai_fetched_at?: string;
  market_state?: string;
  organic_probability?: number;
  whale_movement: boolean;
  risk_analysis?: string;
}

export const usePumpAlerts = (symbol?: string) => {
  return useQuery({
    queryKey: ['pump_alerts', symbol],
    queryFn: async () => {
      try {
        if (symbol) {
          const { data, error } = await supabase
            .from('pump_alerts')
            .select('*')
            .eq('symbol', symbol)
            .order('detected_at', { ascending: false })
            .limit(1)
            .single();

          if (error) {
            console.warn(`Pump alert fetch error for ${symbol}:`, error.code);
            if (error.code === 'PGRST116' || error.code === 'PGRST001') {
              return null;
            }
            throw error;
          }
          return data as PumpAlert;
        }
        return null;
      } catch (error) {
        console.error('usePumpAlerts error:', error);
        throw error;
      }
    },
    staleTime: Infinity,
  });
};

// Legacy alias for backward compatibility
export const useSignalData = usePumpAlerts;
export type Signal = PumpAlert;
