import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BackgroundAIWorkerConfig {
  enabled: boolean;
  pollInterval: number; // How often to check for pending jobs (in milliseconds)
  maxConcurrentJobs: number; // Maximum jobs to process simultaneously
}

// Background AI worker that processes analysis jobs asynchronously
export const useBackgroundAIWorker = (config: BackgroundAIWorkerConfig = {
  enabled: true,
  pollInterval: 5000, // Check every 5 seconds
  maxConcurrentJobs: 1
}) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  // Process a single pending analysis job
  const processPendingJob = async () => {
    if (isProcessingRef.current) return null;

    try {
      isProcessingRef.current = true;

      // Find pending job
      const { data: job, error: findError } = await supabase
        .from('analysis_jobs')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (findError || !job) {
        return null; // No pending jobs
      }

      console.log(`[AI Worker] Processing job for ${job.symbol}`);

      // Mark as processing
      await supabase
        .from('analysis_jobs')
        .update({ status: 'PROCESSING', updated_at: new Date().toISOString() })
        .eq('id', job.id);

      try {
        // Parse stored data
        const orderbookData = JSON.parse(job.orderbook_json || '{}');
        const socialData = JSON.parse(job.social_json || '{}');

        // Call AI analysis
        const aiAnalysisResult = await getGeminiStructuredAnalysis(
          job.symbol + 'USDT',
          job.price_change,
          job.volume_spike,
          orderbookData,
          socialData
        );

        // Update job with results
        await supabase
          .from('analysis_jobs')
          .update({
            status: 'COMPLETED',
            risk_score: aiAnalysisResult.risk_score,
            summary: aiAnalysisResult.summary,
            likely_source: aiAnalysisResult.likely_source,
            actionable_insight: aiAnalysisResult.actionable_insight,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        // Also save to pump_alerts for UI display
        const { error: alertError } = await supabase.from('pump_alerts').insert({
          symbol: job.symbol,
          type: 'AI_ANALYSIS',
          price: job.price_at_detection,
          price_change: job.price_change,
          volume: 0, // Will be calculated from volume_spike if needed
          volume_multiplier: job.volume_spike,
          detected_at: job.created_at,
          market_state: 'bear_market',
          orderbook_depth: orderbookData?.depth_usd || null,
          ai_comment: aiAnalysisResult,
          ai_fetched_at: new Date().toISOString(),
          risk_score: aiAnalysisResult.risk_score,
          likely_source: aiAnalysisResult.likely_source,
          actionable_insight: aiAnalysisResult.actionable_insight
        });

        if (alertError) {
          console.error(`[AI Worker] Error saving alert for ${job.symbol}:`, alertError);
        }

        console.log(`[AI Worker] Job completed for ${job.symbol}: Risk Score ${aiAnalysisResult.risk_score}`);

        return {
          symbol: job.symbol,
          risk_score: aiAnalysisResult.risk_score,
          analysis: aiAnalysisResult
        };

      } catch (aiError) {
        console.error(`[AI Worker] AI processing error for job ${job.id}:`, aiError);
        // Mark as failed
        await supabase
          .from('analysis_jobs')
          .update({
            status: 'FAILED',
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);
        return null;
      }

    } catch (error) {
      console.error('[AI Worker] Error in processPendingJob:', error);
      return null;
    } finally {
      isProcessingRef.current = false;
    }
  };

  // Get structured AI analysis for anomaly
  const getGeminiStructuredAnalysis = async (
    symbol: string,
    priceChange: number,
    volumeSpike: number,
    orderbookData: { total_bids_usd: number; total_asks_usd: number; depth_usd: number; is_thin: boolean } | null,
    socialData: { mention_increase_percent: number; sentiment: string }
  ) => {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return {
        risk_score: 50,
        summary: 'AI analysis unavailable - potential anomaly detected',
        likely_source: 'Unknown',
        actionable_insight: 'Monitor the price movement closely'
      };
    }

    try {
      const prompt = `GÖREV: Sen bir kripto para piyasası anomali analistisin.
Sana verilen verileri analiz et ve bir 'Pump & Dump' veya manipülasyon riskini değerlendir.

VERİLER:
- Coin: $${symbol.replace('USDT', '')}USDT
- Son 1dk Fiyat Değişimi: +${priceChange.toFixed(2)}%
- Hacim Artışı (Ortalamaya Göre): ${volumeSpike.toFixed(1)}x
- Emir Defteri (+/- %2): ${orderbookData?.depth_usd ? (orderbookData.depth_usd / 1000000).toFixed(1) + 'M' : 'Unknown'} USD (${orderbookData?.is_thin ? 'ZAYIF' : 'GÜÇLÜ'})
- Sosyal Medya (Son 10dk): ${socialData?.mention_increase_percent || 0}% artış

ANALİZ İSTEĞİ:
Bu verilere dayanarak, aşağıdaki JSON formatında bir risk analizi oluştur:

{
  "risk_score": (0-100 arası bir manipülasyon/tuzak riski puanı),
  "summary": (1-2 cümlelik, yatırımcı dostu özet ve sonuç. Örn: 'Yüksek Risk: ...'),
  "likely_source": ('Organik Alım', 'Balina Operasyonu', 'Pump Grubu / Söylenti', 'Short Squeeze', 'Bilinmiyor'),
  "actionable_insight": (Yatırımcıya 1 cümlelik eyleme dönük fikir. Örn: 'FOMO'dan kaçının', 'Hareketi izlemeye alın')
}

Sadece JSON çıktısı ver. Başka hiçbir açıklama yapma.`;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + GEMINI_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }
    } catch (error) {
      console.error('[AI Worker] AI analysis error:', error);
    }

    return {
      risk_score: 50,
      summary: 'Analysis failed - monitor the anomaly',
      likely_source: 'Unknown',
      actionable_insight: 'Exercise caution with this movement'
    };
  };

  // Start the background worker
  useEffect(() => {
    if (!config.enabled) return;

    console.log('[AI Worker] Starting background AI worker...');

    const startWorker = () => {
      intervalRef.current = setInterval(async () => {
        try {
          await processPendingJob();
        } catch (error) {
          console.error('[AI Worker] Worker error:', error);
        }
      }, config.pollInterval);
    };

    startWorker();

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      console.log('[AI Worker] Stopped background AI worker');
    };
  }, [config.enabled, config.pollInterval]);

  return {
    isRunning: !!intervalRef.current,
    stopWorker: () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };
};
