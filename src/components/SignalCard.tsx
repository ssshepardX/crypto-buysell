import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Signal } from '@/types/crypto';
import { ArrowUpRight, ArrowDownRight, Target, Star, Sparkles } from 'lucide-react';
import { useSignalData, RiskLevel } from '@/hooks/useSignalData';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

interface SignalCardProps {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  isFavorite: boolean;
  onToggleFavorite: (symbol: string) => void;
}

const RiskBadge: React.FC<{ risk: RiskLevel }> = ({ risk }) => {
  const riskVariants = {
    Low: 'bg-green-500/20 text-green-400 border-green-500/30',
    Moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    High: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return <Badge variant="outline" className={cn("absolute top-4 right-12", riskVariants[risk])}>{risk}</Badge>;
};

const SignalCard: React.FC<SignalCardProps> = ({ name, symbol, price, change24h, isFavorite, onToggleFavorite }) => {
  const { data, isLoading: isSignalLoading } = useSignalData(symbol);
  
  const signal = data?.signal || 'Hold';
  const reasoning = data?.reasoning || 'Loading analysis...';
  const risk = data?.risk;
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
    <Card className="flex flex-col justify-between relative">
      <Star
        className={cn(
          "absolute top-4 right-4 h-5 w-5 cursor-pointer transition-colors",
          isFavorite ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground hover:text-yellow-400"
        )}
        onClick={() => onToggleFavorite(symbol)}
      />
      {risk && <RiskBadge risk={risk} />}
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
          
          <div className="mt-4 text-sm text-muted-foreground flex items-start space-x-2">
            <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0 text-purple-400" />
            {isSignalLoading ? <Skeleton className="h-8 w-full" /> : <p>{reasoning}</p>}
          </div>

          {signal === 'Buy' && tp1 && (
            <div className="mt-4 space-y-2 text-sm">
              <h4 className="font-semibold flex items-center"><Target className="h-4 w-4 mr-2"/>Take Profit Levels</h4>
              <div className="flex justify-between items-center bg-secondary p-2 rounded-md">
                <span className="text-muted-foreground">TP1:</span>
                <span className="font-mono font-semibold">${tp1.toLocaleString()}</span>
              </div>
              {tp2 && <div className="flex justify-between items-center bg-secondary p-2 rounded-md">
                <span className="text-muted-foreground">TP2:</span>
                <span className="font-mono font-semibold">${tp2.toLocaleString()}</span>
              </div>}
              {tp3 && <div className="flex justify-between items-center bg-secondary p-2 rounded-md">
                <span className="text-muted-foreground">TP3:</span>
                <span className="font-mono font-semibold">${tp3.toLocaleString()}</span>
              </div>}
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