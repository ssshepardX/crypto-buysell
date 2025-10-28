import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Signal } from '@/types/crypto';
import { ArrowUpRight, ArrowDownRight, Star, Sparkles } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

interface SignalCardProps {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  isFavorite: boolean;
  onToggleFavorite: (symbol: string) => void;
  signalData: { signal: Signal; reasoning: string } | undefined;
}

const SignalCard: React.FC<SignalCardProps> = ({ name, symbol, price, change24h, isFavorite, onToggleFavorite, signalData }) => {
  const signal = signalData?.signal || 'Hold';
  const reasoning = signalData?.reasoning || 'Loading analysis...';

  const getSignalClasses = (currentSignal: Signal): string => {
    if (currentSignal === 'Buy') return 'bg-green-600 hover:bg-green-700 text-white';
    if (currentSignal === 'Sell') return 'bg-red-600 hover:bg-red-700 text-white';
    return 'bg-gray-500 hover:bg-gray-600 text-white';
  };

  const isPositiveChange = change24h >= 0;

  return (
    <Card className="flex flex-col justify-between relative">
      <Star
        className={cn(
          "absolute top-4 right-4 h-5 w-5 cursor-pointer transition-colors",
          isFavorite ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground hover:text-yellow-400"
        )}
        onClick={() => onToggleFavorite(symbol)}
      />
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
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: price > 1 ? 2 : 8 })}</div>
          <div className={`flex items-center text-sm ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
            {isPositiveChange ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span>{change24h.toFixed(2)}% (24h)</span>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground flex items-start space-x-2 h-12">
            <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0 text-purple-400" />
            <p>{reasoning}</p>
          </div>
        </CardContent>
      </div>
      <CardFooter>
        {!signalData ? (
          <Skeleton className="h-8 w-full" />
        ) : (
          <Badge 
            className={cn('w-full justify-center py-2 text-md', getSignalClasses(signal))}
          >
            {signal}
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
};

export default SignalCard;