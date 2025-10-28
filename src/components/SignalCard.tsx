import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Signal } from '@/types/crypto';
import { ArrowUpRight, ArrowDownRight, Info, Target } from 'lucide-react';
import { useSignalData } from '@/hooks/useSignalData';
import { Skeleton } from './ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SignalCardProps {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
}

const SignalCard: React.FC<SignalCardProps> = ({ name, symbol, price, change24h }) => {
  const { data, isLoading: isSignalLoading } = useSignalData(symbol);
  
  const signal = data?.signal || 'Hold';
  const reasoning = data?.reasoning || 'Loading analysis...';
  const tp1 = data?.tp1;
  const tp2 = data?.tp2;
  const tp3 = data?.tp3;

  const getSignalVariant = (currentSignal: Signal): 'destructive' | 'secondary' | 'default' => {
    if (currentSignal === 'Sell') return 'destructive';
    if (currentSignal === 'Hold') return 'secondary';
    return 'default';
  };

  const getSignalText = (currentSignal: Signal): string => {
    if (currentSignal === 'Buy') return 'Buy';
    if (currentSignal === 'Sell') return 'Sell';
    return 'Hold';
  }

  const isPositiveChange = change24h >= 0;

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarFallback>{symbol.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg font-medium">{name}</CardTitle>
              <p className="text-sm text-muted-foreground">{symbol}</p>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{reasoning}</p>
            </TooltipContent>
          </Tooltip>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: price > 1 ? 2 : 8 })}</div>
          <div className={`flex items-center text-sm ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
            {isPositiveChange ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span>{change24h.toFixed(2)}% (24h)</span>
          </div>
          {signal === 'Buy' && tp1 && (
            <div className="mt-4 space-y-2 text-sm">
              <h4 className="font-semibold flex items-center"><Target className="h-4 w-4 mr-2"/>Take Profit Levels</h4>
              <div className="flex justify-between items-center bg-secondary p-2 rounded-md">
                <span className="text-muted-foreground">TP1:</span>
                <span className="font-mono font-semibold">${parseFloat(tp1).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center bg-secondary p-2 rounded-md">
                <span className="text-muted-foreground">TP2:</span>
                <span className="font-mono font-semibold">${parseFloat(tp2).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center bg-secondary p-2 rounded-md">
                <span className="text-muted-foreground">TP3:</span>
                <span className="font-mono font-semibold">${parseFloat(tp3).toLocaleString()}</span>
              </div>
            </div>
          )}
        </CardContent>
      </div>
      <CardFooter>
        {isSignalLoading ? (
          <Skeleton className="h-8 w-full" />
        ) : (
          <Badge 
            variant={getSignalVariant(signal)} 
            className={`w-full justify-center py-2 text-md ${signal === 'Buy' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
          >
            {getSignalText(signal)}
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
};

export default SignalCard;