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
import { Shield, TrendingUp } from 'lucide-react';

const fetchAnalysisHistory = async () => {
  const { data: analyses, error } = await supabase
    .from('pump_alerts')
    .select('*')
    .in('type', ['AI_ANALYSIS', 'BASIC_ANOMALY'])
    .order('detected_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching analysis history:", error);
    throw new Error(error.message);
  }
  return analyses;
};

const AnalysisHistory = () => {
  const { data: analyses, isLoading } = useQuery({
    queryKey: ['analysisHistory'],
    queryFn: fetchAnalysisHistory,
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!analyses || analyses.length === 0) {
    return <p className="text-center text-muted-foreground">No analysis history yet.</p>;
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'bg-red-600';
    if (score >= 60) return 'bg-orange-600';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 80) return 'High Risk';
    if (score >= 60) return 'Medium Risk';
    if (score >= 40) return 'Low Risk';
    return 'Safe';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Change</TableHead>
            <TableHead className="text-right">Volume x</TableHead>
            <TableHead>Risk Level</TableHead>
            <TableHead>Analysis</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {analyses.map((analysis) => {
            const aiComment = analysis.ai_comment as { risk_score?: number; summary?: string; riskAnalysis?: string } | undefined;
            const riskScore = analysis.risk_score || aiComment?.risk_score || 0;
            const summary = aiComment?.summary || aiComment?.riskAnalysis || 'Analysis available';

            return (
              <TableRow key={analysis.id}>
                <TableCell className="font-medium">{analysis.symbol}</TableCell>
                <TableCell>
                  <Badge variant={analysis.type === 'AI_ANALYSIS' ? 'default' : 'secondary'}>
                    {analysis.type === 'AI_ANALYSIS' ? 'AI Analysis' : 'Basic Anomaly'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  ${parseFloat(analysis.price).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={analysis.price_change >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {analysis.price_change?.toFixed(2)}%
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {analysis.volume_multiplier?.toFixed(1)}x
                </TableCell>
                <TableCell>
                  <Badge className={`text-white ${getRiskColor(riskScore)}`}>
                    {getRiskLabel(riskScore)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="truncate text-sm" title={summary}>
                    {summary}
                  </div>
                </TableCell>
                <TableCell className="text-right text-xs">
                  {new Date(analysis.detected_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default AnalysisHistory;
