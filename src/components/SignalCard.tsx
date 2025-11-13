import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Signal as SignalType } from '@/hooks/useSignalData';
import { ArrowUpRight, ArrowDownRight, Star, Sparkles, Shield, TrendingUp, Volume2 } from 'lucide-react';
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
  const riskScore = signalData?.risk_score || 0;
  const summary = signalData?.ai_comment?.summary || signalData?.summary;
  const likelySource = signalData?.likely_source || signalData?.ai_comment?.likely_source;
  const actionableInsight = signalData?.actionable_insight || signalData?.ai_comment?.actionable_insight;
  const volumeMultiplier = signalData?.volume_multiplier || 1;

  const getRiskColor = (score: number): string => {
    if (score >= 80) return 'bg-red-600';
    if (score >= 60) return 'bg-orange-600';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getRiskLabel = (score: number): string => {
    if (score >= 80) return 'High Risk';
    if (score >= 60) return 'Medium Risk';
    if (score >= 40) return 'Low Risk';
    return 'Safe';
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

          {summary && (
            <div className="text-xs text-muted-foreground flex items-start space-x-2 h-8">
              <Shield className="h-3 w-3 mt-0.5 flex-shrink-0 text-orange-400" />
              <p className="truncate">{summary}</p>
            </div>
          )}

          {likelySource && (
            <div className="text-xs text-muted-foreground flex items-start space-x-2 h-6">
              <TrendingUp className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-400" />
              <p className="truncate">Source: {likelySource}</p>
            </div>
          )}

          <div className="space-y-1 pt-1">
            {/* Volume indicator with bars */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Volume2 size={12} className="text-blue-500" />
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1 rounded-sm",
                        i < Math.min(volumeMultiplier / 0.5, 5)
                          ? "bg-blue-500 h-2"
                          : "bg-gray-300 h-1"
                      )}
                    />
                  ))}
                </div>
                <span className="text-blue-600 font-medium">{volumeMultiplier.toFixed(1)}x</span>
              </div>
              <Badge className={cn("text-white text-xs", getRiskColor(riskScore))}>
                {getRiskLabel(riskScore)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </div>
      <CardFooter className="p-1 pt-2">
        {!signalData ? (
          <Skeleton className="h-8 w-full" />
        ) : (
          <Badge
            className={cn('w-full justify-center py-1.5 text-sm', getRiskColor(riskScore))}
          >
            Risk Score: {riskScore}/100
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
};

export default SignalCard;
