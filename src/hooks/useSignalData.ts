import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { generateSignal } from '@/lib/technical-analysis';
import { Signal } from '@/types/crypto';

const fetchKlineData = async (symbol: string) => {
  const { data, error } = await supabase.functions.invoke('binance-proxy', {
    body: { symbol: `${symbol}USDT`, interval: '1h', limit: 100 },
  });

  if (error) {
    throw new Error(`Kripto geçmiş verisi çekilirken hata oluştu (${symbol}): ${error.message}`);
  }
  
  return data;
};

export const useSignalData = (symbol: string) => {
  return useQuery<Signal, Error>({
    queryKey: ['signal', symbol],
    queryFn: async () => {
      const klines = await fetchKlineData(symbol);
      if (!klines || klines.length === 0) {
        return 'Hold';
      }
      return generateSignal(klines);
    },
    // Sinyalleri saatte bir yeniden hesapla
    refetchInterval: 60 * 60 * 1000, 
    // Veriyi 30 dakika boyunca taze kabul et
    staleTime: 30 * 60 * 1000,
  });
};