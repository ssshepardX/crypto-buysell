// Pump Alerts Component - Displays real-time pump detection alerts

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, TrendingUp, Volume2, Brain, Clock, DollarSign } from 'lucide-react';
import { PumpAlert } from '@/hooks/useMarketWatcher';
import { formatDistanceToNow } from 'date-fns';

interface PumpAlertsProps {
  alerts: PumpAlert[];
  isLoading?: boolean;
}

export const PumpAlerts = ({ alerts, isLoading = false }: PumpAlertsProps) => {
  const [selectedAlert, setSelectedAlert] = useState<PumpAlert | null>(null);

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'moderate': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getRiskIcon = (riskLevel?: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'critical':
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'moderate': return <TrendingUp className="h-4 w-4" />;
      default: return <Volume2 className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Pump Alerts
          </CardTitle>
          <CardDescription>Real-time pump detection and AI analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Pump Alerts
          {alerts.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Real-time pump detection and AI analysis</CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pump alerts detected yet.</p>
            <p className="text-sm">Market watcher will notify you when pumps are detected.</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedAlert?.id === alert.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{alert.symbol.replace('USDT', '')}</h3>
                        <Badge variant={getRiskColor(alert.aiComment?.riskLevel)}>
                          {getRiskIcon(alert.aiComment?.riskLevel)}
                          <span className="ml-1">{alert.aiComment?.riskLevel || 'Unknown'}</span>
                        </Badge>
                        {alert.whaleMovement && (
                          <Badge variant="destructive" className="text-xs">
                            🐋 Whale
                          </Badge>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(alert.detectedAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">${alert.price.toFixed(4)}</p>
                          <p className="text-xs text-green-600">+{alert.priceChange.toFixed(2)}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">{alert.volumeMultiplier.toFixed(1)}x</p>
                          <p className="text-xs text-muted-foreground">Volume</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-sm font-medium">${(alert.volume / 1000000).toFixed(1)}M</p>
                          <p className="text-xs text-muted-foreground">Volume</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-indigo-500" />
                        <div>
                          <p className="text-sm font-medium">
                            {alert.aiComment ? 'AI' : 'Pending'}
                          </p>
                          <p className="text-xs text-muted-foreground">Analysis</p>
                        </div>
                      </div>
                    </div>

                    {selectedAlert?.id === alert.id && (
                      <div className="mt-4 p-3 bg-muted rounded-lg space-y-3">
                        {alert.aiComment ? (
                          <>
                            <div>
                              <h4 className="font-medium mb-1">AI Analysis</h4>
                              <p className="text-sm text-muted-foreground">
                                {alert.aiComment.riskAnalysis}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-1">Trading Advice</h4>
                              <p className="text-sm">{alert.aiComment.tradingAdvice}</p>
                            </div>
                            {alert.aiComment.warningSignals && alert.aiComment.warningSignals.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-1">Warning Signals</h4>
                                <ul className="text-sm space-y-1">
                                  {alert.aiComment.warningSignals.map((signal, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                      {signal}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Organic: {alert.aiComment.isOrganic ? 'Yes' : 'No'}</span>
                              <span>Whale Probability: {alert.aiComment.whaleMovementProbability}%</span>
                              <span>Market: {alert.aiComment.marketState}</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <Brain className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              AI analysis in progress...
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default PumpAlerts;
