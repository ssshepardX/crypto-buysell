import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Signal as SignalType } from '@/hooks/useSignalData';
import { ArrowUpRight, ArrowDownRight, Star, Sparkles, Shield } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

interface SignalCardProps {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  isFavorite: boolean;
  onToggleFavorite: (symbol: string) => void;
  signalData: SignalType;
}

const SignalCard: React.FC<SignalCardProps> = ({ name, symbol, price, change24h, isFavorite, onToggleFavorite, signalData }) => {
  const signal = signalData?.type || 'Hold';
  const riskLevel = signalData?.ai_analysis?.risk_level;
  const tradingAdvice = signalData?.ai_analysis?.trading_advice;

  const getSignalClasses = (currentSignal: string): string => {
    if (currentSignal === 'Buy') return 'bg-green-600 hover:bg-green-700 text-white';
    if (currentSignal === 'Sell') return 'bg-red-600 hover:bg-red-700 text-white';
    return 'bg-gray-500 hover:bg-gray-600 text-white';
  };
  
  const getRiskColor = (riskLevel?: string) => {
    if (riskLevel === 'Low') return 'bg-sky-500';
    if (riskLevel === 'Medium') return 'bg-yellow-500';
    if (riskLevel === 'High') return 'bg-orange-600';
    return 'bg-gray-400';
  };

  const isPositiveChange = change24h >= 0;

  return (
    <Card className="flex flex-col justify-between relative bg-secondary/30 p-3">
      <Star
        className={cn(
          "absolute top-3 right-3 h-5 w-5 cursor-pointer transition-colors",
          isFavorite ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground hover:text-yellow-400"
        )}
        onClick={() => onToggleFavorite(symbol)}
      />
      <div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-1 pb-2">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{symbol.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base font-medium">{name}</CardTitle>
              <p className="text-xs text-muted-foreground">{symbol}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-1 space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="text-xl font-bold">${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: price > 1 ? 2 : 8 })}</div>
            <div className={`flex items-center text-xs font-semibold ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
              {isPositiveChange ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              <span>{change24h.toFixed(2)}%</span>
            </div>
          </div>
          
          {tradingAdvice && (
            <div className="text-xs text-muted-foreground flex items-start space-x-2 h-8">
              <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0 text-purple-400" />
              <p className="truncate">{tradingAdvice}</p>
            </div>
          )}

          {signal === 'Buy' && riskLevel && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5"><Shield size={14} /> Risk</div>
                <Badge className={cn("text-white", getRiskColor(riskLevel))}>{riskLevel}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </div>
      <CardFooter className="p-1 pt-2">
        {!signalData ? (
          <Skeleton className="h-8 w-full" />
        ) : (
          <Badge 
            className={cn('w-full justify-center py-1.5 text-sm', getSignalClasses(signal))}
          >
            {signal}
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
};

export default SignalCard;