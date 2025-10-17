import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Signal } from '@/types/crypto';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useSignalData } from '@/hooks/useSignalData';
import { Skeleton } from './ui/skeleton';

interface SignalCardProps {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
}

const SignalCard: React.FC<SignalCardProps> = ({ name, symbol, price, change24h }) => {
  const { data: signal, isLoading: isSignalLoading } = useSignalData(symbol);

  const getSignalVariant = (currentSignal: Signal): 'destructive' | 'secondary' | 'default' => {
    if (currentSignal === 'Sell') return 'destructive';
    if (currentSignal === 'Hold') return 'secondary';
    return 'default';
  };

  const getSignalText = (currentSignal: Signal): string => {
    if (currentSignal === 'Buy') return 'Al';
    if (currentSignal === 'Sell') return 'Sat';
    return 'Tut';
  }

  const isPositiveChange = change24h >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarFallback>{symbol.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg font-medium">{name}</CardTitle>
            <p className="text-sm text-muted-foreground">{symbol}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: price > 1 ? 2 : 8 })}</div>
        <div className={`flex items-center text-sm ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
          {isPositiveChange ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          <span>{change24h.toFixed(2)}% (24s)</span>
        </div>
      </CardContent>
      <CardFooter>
        {isSignalLoading ? (
          <Skeleton className="h-8 w-full" />
        ) : (
          <Badge 
            variant={getSignalVariant(signal || 'Hold')} 
            className={`w-full justify-center py-2 text-md ${signal === 'Buy' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
          >
            {getSignalText(signal || 'Hold')}
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
};

export default SignalCard;