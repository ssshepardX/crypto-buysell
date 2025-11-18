// PROSESS 2: AI AGENT WORKER (AI Analist)
// Görevi: YAVAŞ çalışır, DB'den "PENDING" işleri alır, AI'ı çağırır,
// sonucu DB'ye yazar ve bildirimi gönderir.
import { supabase } from '@/integrations/supabase/client';
import { notificationService } from './notificationService';
import { analyzeWithLayer3AI, type Layer3AnalysisInput } from './aiService';
import { type RiskScoreResult } from './riskScoringService';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface OrderbookData {
  depth_usd: number;
  is_thin: boolean;
}

interface SocialData {
  mention_increase_percent: number;
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

  start(intervalMs: number = 5000): void {
    if (this.isRunning) return;
    console.log("🤖 AI Agent Worker Başlatıldı...");
    this.isRunning = true;
    this.workerInterval = setInterval(() => this.processNextJob(), intervalMs);
    console.log(`✅ AI Worker ${intervalMs}ms aralıklarla çalışıyor.`);
  }

  stop(): void {
    if (!this.isRunning) return;
    console.log("🛑 AI Agent Worker Durduruluyor...");
    if (this.workerInterval) clearInterval(this.workerInterval);
    this.isRunning = false;
    console.log("✅ AI Worker durduruldu.");
  }

  private async processNextJob(): Promise<void> {
    if (this.processingLock) return;
    this.processingLock = true;

    let job = null;
    try {
      // 4.1 İŞ BUL VE KİLİTLE
      job = await this.findAndLockPendingJob();

      if (job) {
        console.log(`🔄 İş alınıyor: ${job.symbol}`);

        // 4.2 15-DAKİKA CACHE KURALINI KONTROL ET
        const cacheCutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { data: recentJob, error: cacheError } = await supabase
          .from('analysis_jobs')
          .select('*')
          .eq('symbol', job.symbol.replace('USDT', ''))
          .eq('status', 'COMPLETED')
          .gte('created_at', cacheCutoff)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cacheError) {
          console.error('Cache kontrol hatası:', cacheError);
        } else if (recentJob) {
          console.log(`⏰ Cache bulundu (${job.symbol}): ${recentJob.created_at} - Analiz atlanıyor`);
          await this.updateJobStatus(job.id, "CACHED");
          return;
        }

        // 4.3 TECHNICAL VERİLERİ HAZIRLA (BURADA VERECEK SİSTEM EKLE)
        // TODO: Real technical data collection needed here
        // For now, we'll simulate the data structure
        const coinData = {
          symbol: job.symbol,
          priceChangePercent5m: job.price_change,
          volume: job.volume_spike * 100000, // Estimated volume
          avgVolume: 100000, // Estimated average
          marketCap: 10000000, // Estimated market cap (passes >$10M filter)
          rsi: 70, // Default RSI - needs real calculation
          totalBidsUSD: 500000, // Default - needs real orderbook
          totalAsksUSD: 600000, // Default - needs real orderbook
          volumeToMarketCapRatio: 0.05, // Default - needs calculation
          priceChangePercent1m: job.price_change
        };

        // 4.4 LAYER 2: MATH-BASED RISK SCORING
        const { calculateBaseRiskScore } = await import('./riskScoringService');
        const riskResult = calculateBaseRiskScore(coinData);

        if (!riskResult) {
          throw new Error("Risk scoring failed");
        }

        // 4.5 LAYER 3: AI QUALITATIVE ANALYSIS
        const orderbookData = JSON.parse(job.orderbook_json || '{}');
        const layer3Input: Layer3AnalysisInput = {
          symbol: job.symbol,
          baseRiskScore: riskResult.base_risk_score,
          rsi: riskResult.technical_data.rsi,
          isThin: orderbookData.is_thin || false
        };

        const aiAnalysisResult = await analyzeWithLayer3AI(layer3Input);

        if (aiAnalysisResult) {
          // 4.6 SUCCESS: Map AI result to database fields
          const mappedResult = {
            risk_score: aiAnalysisResult.final_risk_score,
            summary: aiAnalysisResult.verdict,
            likely_source: aiAnalysisResult.likely_scenario,
            actionable_insight: aiAnalysisResult.short_comment
          };

          await this.updateJobWithAnalysis(job.id, mappedResult, "COMPLETED");
          console.log(`✅ İş tamamlandı: ${job.symbol} (Final Score: ${mappedResult.risk_score})`);

          // 4.7 SEND NOTIFICATION IF HIGH RISK
          await this.sendNotification(job.symbol, mappedResult);
        } else {
          throw new Error("Layer 3 AI analysis failed");
        }
      }
      // If no job available, wait silently
    } catch (error) {
      console.error("❌ AI Worker Hatası:", error);
      if (job) {
        // 4.8 ERROR HANDLING
        await this.updateJobStatus(job.id, "FAILED");
        console.log(`"FAIL" olarak işaretlendi: ${job.symbol} (ID: ${job.id})`);
      }
    } finally {
      this.processingLock = false;
    }
  }

  private async findAndLockPendingJob() {
    // Supabase'de "SELECT ... FOR UPDATE" olmadığı için,
    // bir RPC (veritabanı fonksiyonu) en iyi çözümdür.
    // Bu fonksiyon, atomik olarak bir işi bulur, durumunu günceller ve döndürür.
    const { data, error } = await supabase.rpc('find_and_lock_job');
    
    if (error) {
      console.error('findAndLockPendingJob RPC hatası:', error);
      return null;
    }
    return data;
  }

  private async updateJobWithAnalysis(jobId: string, aiResult: AIAnalysisResult, status: string) {
    const { error } = await supabase
      .from('analysis_jobs')
      .update({
        status: status,
        risk_score: aiResult.risk_score,
        summary: aiResult.summary,
        likely_source: aiResult.likely_source,
        actionable_insight: aiResult.actionable_insight,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (error) console.error('updateJobWithAnalysis hatası:', error);
  }

  private async updateJobStatus(jobId: string, status: string) {
    const { error } = await supabase
      .from('analysis_jobs')
      .update({ status: status, completed_at: new Date().toISOString() })
      .eq('id', jobId);
    if (error) console.error('updateJobStatus hatası:', error);
  }

  private async getGeminiStructuredAnalysis(
    modelName: string,
    symbol: string,
    priceChange: number,
    volumeSpike: number,
    orderbookData: OrderbookData,
    socialData: SocialData
  ): Promise<AIAnalysisResult | null> {
    const prompt = `TASK: You are a crypto market anomaly analyst. 
Analyze the provided data and assess the risk of a 'Pump & Dump' or manipulation.

DATA:
- Coin: ${symbol}
- Last 1m Price Change: +${priceChange.toFixed(2)}%
- Volume Spike (vs. Avg): ${volumeSpike.toFixed(1)}x
- Order Book Depth (+/- 2%): ${orderbookData.depth_usd.toFixed(0)} USD (Status: ${orderbookData.is_thin ? 'THIN' : 'STRONG'})
- Social Media (Last 10min): ${socialData.mention_increase_percent}% increase

ANALYSIS REQUEST:
Based on this data, generate a risk analysis in the following JSON format.

PERFECT EXAMPLE OF OUTPUT:
{
  "risk_score": 95,
  "summary": "High Risk: Sudden volume spike on a thin order book. Typical 'Pump & Dump' trap.",
  "likely_source": "Pump Group / Coordinated Movement",
  "actionable_insight": "Avoid FOMO. A pullback is likely."
}

Output ONLY the JSON. Do not include any other explanations.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`);
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return null;

    } catch (error) {
      console.error(`Gemini API hatası (${symbol}):`, error);
      return null;
    }
  }

  private async sendNotification(symbol: string, analysis: AIAnalysisResult): Promise<void> {
    if (analysis.risk_score >= 75) {
      await notificationService.notifyHighRisk(
        symbol,
        analysis.risk_score,
        analysis.summary
      );
    }
  }
}

export const aiWorkerService = AIWorkerService.getInstance();
