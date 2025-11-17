import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PumpAlert {
  id: string;
  symbol: string;
  type: string; // 'AI_ANALYSIS', 'BASIC_ANOMALY', or 'PUMP_ALERT'
  price: number;
  price_change: number;
  volume: number;
  avg_volume?: number;
  volume_multiplier?: number;
  volume_24h_change?: number;
  detected_at: string;
  ai_comment?: {
    // Legacy AI comment structure
    isOrganic: boolean;
    whaleMovementProbability: number;
    riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
    riskAnalysis: string;
    tradingAdvice: string;
    warningSignals: string[];
    marketState: string;
  } | {
    // New AI analysis structure
    risk_score: number;
    summary: string;
    likely_source: string;
    actionable_insight: string;
  };
  ai_fetched_at?: string;
  market_state?: string;
  market_cap?: number;
  orderbook_depth?: number;
  organic_probability?: number;
  whale_movement?: boolean;
  risk_score?: number;
  likely_source?: string;
  actionable_insight?: string;
  risk_analysis?: string | number;
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
            .limit(1);

          if (error) {
            console.warn(`Pump alert fetch error for ${symbol}:`, error.code, error.message);
            if (error.code === 'PGRST116' || error.code === 'PGRST001') {
              return null;
            }
            throw error;
          }

          // Return first item or null if no data
          return data && data.length > 0 ? data[0] as PumpAlert : null;
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
