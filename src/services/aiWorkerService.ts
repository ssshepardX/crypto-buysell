// AI Worker Service - Background processing for AI analysis jobs
import { supabase } from '@/integrations/supabase/client';
import { notificationService } from './notificationService';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-exp:generateContent';

interface OrderbookData {
  total_bids_usd: number;
  total_asks_usd: number;
  depth_usd: number;
  is_thin: boolean;
}

interface SocialData {
  mention_increase_percent: number;
  sentiment: string;
}

interface AIAnalysisResult {
  risk_score: number;
  summary: string;
  likely_source: string;
  actionable_insight: string;
}

class AIWorkerService {
  private static instance: AIWorkerService;
  private isRunning: boolean = false;
  private workerInterval: NodeJS.Timeout | null = null;
  private processingLock: boolean = false;

  private constructor() {}

  static getInstance(): AIWorkerService {
    if (!AIWorkerService.instance) {
      AIWorkerService.instance = new AIWorkerService();
    }
    return AIWorkerService.instance;
  }

  // Start the worker
  start(intervalMs: number = 5000): void {
    if (this.isRunning) {
      console.log('⚠️ AI Worker already running');
      return;
    }

    console.log('🤖 Starting AI Worker Service...');
    this.isRunning = true;

    // Process immediately
    this.processNextJob();

    // Set up periodic processing
    this.workerInterval = setInterval(() => {
      this.processNextJob();
    }, intervalMs);

    console.log(`✅ AI Worker started (checking every ${intervalMs}ms)`);
  }

  // Stop the worker
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping AI Worker Service...');
    
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
    }

    this.isRunning = false;
    console.log('✅ AI Worker stopped');
  }

  // Process the next pending job
  private async processNextJob(): Promise<void> {
    // Prevent concurrent processing
    if (this.processingLock) {
      return;
    }

    this.processingLock = true;

    try {
      // Find oldest pending job
      const { data: job, error: findError } = await supabase
        .from('analysis_jobs')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (findError || !job) {
        return; // No pending jobs
      }

      console.log(`🔄 Processing AI job for ${job.symbol}...`);

      // Mark as processing
      await supabase
        .from('analysis_jobs')
        .update({ status: 'PROCESSING' })
        .eq('id', job.id);

      try {
        // Parse stored data
        const orderbookData: OrderbookData | null = job.orderbook_json 
          ? JSON.parse(job.orderbook_json) 
          : null;
        const socialData: SocialData = job.social_json 
          ? JSON.parse(job.social_json) 
          : { mention_increase_percent: 0, sentiment: 'neutral' };

        // Call AI analysis
        const aiAnalysisResult = await this.getGeminiAnalysis(
          job.symbol,
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
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);

        // Save to pump_alerts for UI display
        await supabase.from('pump_alerts').insert({
          symbol: job.symbol,
          type: 'AI_ANALYSIS',
          price: job.price_at_detection,
          price_change: job.price_change,
          volume: 0,
          volume_multiplier: job.volume_spike,
          detected_at: job.created_at,
          market_state: 'volatile',
          orderbook_depth: orderbookData?.depth_usd || null,
          ai_comment: aiAnalysisResult,
          ai_fetched_at: new Date().toISOString(),
          risk_score: aiAnalysisResult.risk_score,
          likely_source: aiAnalysisResult.likely_source,
          actionable_insight: aiAnalysisResult.actionable_insight
        });

        // Send notification based on risk level
        await this.sendNotification(job.symbol, aiAnalysisResult);

        console.log(`✅ Job completed for ${job.symbol} - Risk Score: ${aiAnalysisResult.risk_score}`);

      } catch (aiError) {
        console.error(`❌ AI processing error for job ${job.id}:`, aiError);
        
        // Mark as failed
        await supabase
          .from('analysis_jobs')
          .update({ 
            status: 'FAILED',
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);
      }

    } catch (error) {
      console.error('❌ Error in processNextJob:', error);
    } finally {
      this.processingLock = false;
    }
  }

  // Get AI analysis from Gemini
  private async getGeminiAnalysis(
    symbol: string,
    priceChange: number,
    volumeSpike: number,
    orderbookData: OrderbookData | null,
    socialData: SocialData
  ): Promise<AIAnalysisResult> {
    if (!GEMINI_API_KEY) {
      return {
        risk_score: 50,
        summary: 'AI analizi kullanılamıyor - potansiyel anomali tespit edildi',
        likely_source: 'Bilinmiyor',
        actionable_insight: 'Fiyat hareketini yakından izleyin'
      };
    }

    try {
      const prompt = `GÖREV: Sen bir kripto para piyasası anomali analistisin.
Sana verilen verileri analiz et ve bir 'Pump & Dump' veya manipülasyon riskini değerlendir.

VERİLER:
- Coin: $${symbol}USDT
- Son 1dk Fiyat Değişimi: +${priceChange.toFixed(2)}%
- Hacim Artışı (Ortalamaya Göre): ${volumeSpike.toFixed(1)}x
- Emir Defteri (+/- %2): ${orderbookData?.depth_usd ? (orderbookData.depth_usd / 1000000).toFixed(1) + 'M' : 'Bilinmiyor'} USD (${orderbookData?.is_thin ? 'ZAYIF' : 'GÜÇLÜ'})
- Sosyal Medya (Son 10dk): ${socialData.mention_increase_percent}% artış

ANALİZ İSTEĞİ:
Bu verilere dayanarak, aşağıdaki JSON formatında bir risk analizi oluştur.

MÜKEMMEL ÇIKTI ÖRNEĞİ:
{
  "risk_score": 95,
  "summary": "Yüksek Risk: Zayıf emir defterinde ani hacim patlaması. Tipik 'Pump & Dump' tuzağı.",
  "likely_source": "Pump Grubu / Koordineli Hareket",
  "actionable_insight": "FOMO'dan kaçının. Geri çekilme muhtemel."
}

SADECE JSON çıktısı ver. Başka açıklama ekleme.`;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 400
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }

      throw new Error('No valid JSON in AI response');

    } catch (error) {
      console.error('AI analysis error:', error);
      return {
        risk_score: 50,
        summary: 'Analiz başarısız - anomaliyi izleyin',
        likely_source: 'Bilinmiyor',
        actionable_insight: 'Bu harekette dikkatli olun'
      };
    }
  }

  // Send notification based on risk level
  private async sendNotification(symbol: string, analysis: AIAnalysisResult): Promise<void> {
    try {
      if (analysis.risk_score >= 80) {
        // Critical/High risk
        await notificationService.notifyHighRisk(
          symbol + 'USDT',
          analysis.risk_score,
          analysis.summary
        );
      } else if (analysis.risk_score >= 60) {
        // Moderate risk - opportunity
        await notificationService.notifyOpportunity(
          symbol + 'USDT',
          analysis.actionable_insight
        );
      }
      // Low risk (< 60) - no notification
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Manual trigger to process a single job
  async processSingleJob(): Promise<void> {
    await this.processNextJob();
  }

  // Get worker status
  getStatus(): { isRunning: boolean; isProcessing: boolean } {
    return {
      isRunning: this.isRunning,
      isProcessing: this.processingLock
    };
  }

  // Get pending job count
  async getPendingJobCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('analysis_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');

      if (error) {
        console.error('Error getting pending job count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getPendingJobCount:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const aiWorkerService = AIWorkerService.getInstance();
