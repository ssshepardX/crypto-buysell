import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Signal {
  id: string;
  symbol: string;
  type: string;
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

export const useSignalData = (userPlan: 'free' | 'scalper' | 'pro' = 'free') => {
  return useQuery<Signal[]>(
    ['signals', userPlan],
    async () => {
      let query = supabase
        .from('signals')
        .select('*')
        .order('time', { ascending: false });

      // Plan-based limitations
      if (userPlan === 'free') {
        // Free users only see one random signal per day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query
          .gte('time', today.toISOString())
          .limit(1);
      } else if (userPlan === 'scalper') {
        // Scalpers see all signals but without detailed AI analysis
        query = query.limit(50);
      } else {
        // Pro users see everything
        query = query.limit(100);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // For scalper plan, remove detailed AI analysis
      if (userPlan === 'scalper') {
        return data.map(signal => ({
          ...signal,
          ai_analysis: signal.ai_analysis ? {
            ...signal.ai_analysis,
            trading_advice: undefined,
            warning_signs: undefined
          } : undefined
        }));
      }

      return data;
    },
    {
      refetchInterval: 60000, // Refetch every minute
      staleTime: 30000, // Consider data stale after 30 seconds
    }
  );
};