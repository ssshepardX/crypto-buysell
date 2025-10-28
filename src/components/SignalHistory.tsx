import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const fetchClosedTrades = async () => {
  // We need to get the buy and sell info. We can do this by fetching sell signals
  // and then using the related_buy_id to get the buy price.
  const { data: sellSignals, error } = await supabase
    .from('signals_log')
    .select('*, related_buy_id(*)') // This fetches the related buy signal info
    .eq('signal_type', 'Sell')
    .not('related_buy_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching closed trades:", error);
    throw new Error(error.message);
  }
  return sellSignals;
};

const SignalHistory = () => {
  const { data: trades, isLoading } = useQuery({
    queryKey: ['closedTrades'],
    queryFn: fetchClosedTrades,
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!trades || trades.length === 0) {
    return <p className="text-center text-muted-foreground">No closed trades yet.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead className="text-right">Buy Price</TableHead>
            <TableHead className="text-right">Sell Price</TableHead>
            <TableHead className="text-right">Profit/Loss</TableHead>
            <TableHead className="text-right">Date Closed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => {
            const buySignal = trade.related_buy_id;
            const isProfitable = trade.profit_loss_percent > 0;
            return (
              <TableRow key={trade.id}>
                <TableCell className="font-medium">{trade.symbol}</TableCell>
                <TableCell className="text-right font-mono">${parseFloat(buySignal.price).toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono">${parseFloat(trade.price).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={isProfitable ? 'default' : 'destructive'} className={isProfitable ? 'bg-green-600' : ''}>
                    {trade.profit_loss_percent.toFixed(2)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{new Date(trade.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default SignalHistory;