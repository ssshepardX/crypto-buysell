import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Percent } from 'lucide-react';

const fetchTradeHistory = async () => {
  const { data, error } = await supabase
    .from('signals_log')
    .select('profit_loss_percent')
    .eq('signal_type', 'Sell') // We only care about closed trades
    .not('profit_loss_percent', 'is', null);

  if (error) {
    console.error("Error fetching trade history:", error);
    throw new Error(error.message);
  }
  return data;
};

const WinRateTracker = () => {
  const { data: trades, isLoading } = useQuery({
    queryKey: ['tradeHistory'],
    queryFn: fetchTradeHistory,
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  const totalTrades = trades?.length || 0;
  const profitableTrades = trades?.filter(t => t.profit_loss_percent > 0).length || 0;
  const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Based on {totalTrades} closed trades
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profitable Trades</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{profitableTrades}</div>
           <p className="text-xs text-muted-foreground">
            Total successful signals
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Losing Trades</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTrades - profitableTrades}</div>
           <p className="text-xs text-muted-foreground">
            Total unsuccessful signals
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WinRateTracker;