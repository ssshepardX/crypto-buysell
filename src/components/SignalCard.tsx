import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  riskScore: number;
  volumeMultiplier: number;
  aiSummary: string;
}

const SignalCard: React.FC<SignalCardProps> = ({ name, symbol, price, change24h, isFavorite, onToggleFavorite, riskScore, volumeMultiplier, aiSummary }) => {
  const summary = aiSummary;
  const likelySource = riskScore > 70 ? 'High Risk Alert' : 'Normal Activity';

  const getRiskColor = (score: number): string => {
    if (score >= 80) return 'bg-rose-500';
    if (score >= 60) return 'bg-rose-400';
    if (score >= 40) return 'bg-yellow-400';
    return 'bg-emerald-400';
  };

  const getRiskLabel = (score: number): string => {
    if (score >= 80) return 'High Risk';
    if (score >= 60) return 'Medium Risk';
    if (score >= 40) return 'Low Risk';
    return 'Safe';
  };

  const isPositiveChange = change24h >= 0;

  return (
    <Card className="flex flex-col justify-between relative bg-slate-950/80 backdrop-blur-xl border-white/10 hover:border-cyan-500/30 transition-all duration-300 rounded-xl p-4">
      <Star
        className={cn(
          "absolute top-4 right-4 h-5 w-5 cursor-pointer transition-colors",
          isFavorite ? "text-yellow-400 fill-yellow-400" : "text-slate-400 hover:text-yellow-400"
        )}
        onClick={() => onToggleFavorite(symbol)}
      />
      <div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-1 pb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 bg-gradient-to-br from-cyan-500 to-sky-600">
              <AvatarFallback className="text-slate-200 font-jetbrains font-medium">{symbol.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg font-inter text-slate-200">{name}</CardTitle>
              <p className="text-sm text-slate-400 font-jetbrains">{symbol}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-1 space-y-3">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-jetbrains font-bold text-slate-200">${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: price > 1 ? 2 : 8 })}</div>
            <div className={`flex items-center font-jetbrains font-medium ${isPositiveChange ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositiveChange ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              <span className="text-lg">{change24h.toFixed(2)}%</span>
            </div>
          </div>

          {summary && (
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-sm text-slate-300 flex items-start space-x-2">
                <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0 text-cyan-400" />
                <p className="font-inter leading-relaxed">{summary}</p>
              </div>
            </div>
          )}

          {likelySource && (
            <div className="text-sm text-slate-400 flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 flex-shrink-0 text-blue-400" />
              <span className="font-inter">Analysis: {likelySource}</span>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-cyan-400" />
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1.5 rounded-full",
                        i < Math.min(volumeMultiplier / 0.5, 5)
                          ? "bg-cyan-400 h-3"
                          : "bg-slate-600 h-2"
                      )}
                    />
                  ))}
                </div>
                <span className="text-cyan-400 font-jetbrains font-medium text-lg">{volumeMultiplier.toFixed(1)}x vol</span>
              </div>
              <Badge className={cn("px-3 py-1 text-white font-inter font-medium border-0", getRiskColor(riskScore))}>
                {getRiskLabel(riskScore)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </div>
      <CardFooter className="p-1 pt-3">
        <Badge
          className={cn('w-full justify-center py-2 font-jetbrains font-medium text-base bg-slate-800/50 text-slate-300 border-0 hover:border-cyan-500/30')}
        >
          AI Risk Score: {riskScore}/100
        </Badge>
      </CardFooter>
    </Card>
  );
};

export default SignalCard;
