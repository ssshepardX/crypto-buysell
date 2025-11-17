// PROSESS 2: AI AGENT WORKER (AI Analist)
// Görevi: YAVAŞ çalışır, DB'den "PENDING" işleri alır, AI'ı çağırır,
// sonucu DB'ye yazar ve bildirimi gönderir.
import { supabase } from '@/integrations/supabase/client';
import { notificationService } from './notificationService';

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
        
        // 4.2 (YAVAŞ) AI ÇAĞRISINI YAP
        const aiAnalysisResult = await this.getGeminiStructuredAnalysis(
          "gemini-1.5-flash",
          job.symbol,
          job.price_change,
          job.volume_spike,
          JSON.parse(job.orderbook_json || '{}'),
          JSON.parse(job.social_json || '{}')
        );

        if (aiAnalysisResult) {
          // 4.3 BAŞARILI: Sonucu DB'ye yaz
          await this.updateJobWithAnalysis(job.id, aiAnalysisResult, "COMPLETED");
          console.log(`✅ İş tamamlandı: ${job.symbol} (Skor: ${aiAnalysisResult.risk_score})`);

          // 4.4 BİLDİRİM GÖNDER
          await this.sendNotification(job.symbol, aiAnalysisResult);
        } else {
          throw new Error("AI analizi boş döndü");
        }
      }
      // Sırada iş yoksa sessizce bekle
    } catch (error) {
      console.error("❌ AI Worker Hatası:", error);
      if (job) {
        // 4.5 HATA YÖNETİMİ
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
