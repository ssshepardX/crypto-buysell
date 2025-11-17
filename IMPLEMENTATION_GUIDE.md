# Crypto Market Watcher - Implementation Guide

## 📋 Genel Bakış

Bu proje, pseudo kodunuza tam uyumlu olarak geliştirilmiş bir kripto piyasa izleme ve anomali tespit sistemidir.

## 🎯 Temel Özellikler

### 1. **Piyasa Gözetmeni (Market Watcher)**
- Top 200 coin'i hacim bazlı otomatik getirme
- 1 dakikalık mum verileri ile sürekli izleme
- Anomali tespiti (fiyat + hacim tetikleyicileri)
- Otomatik tarama (60 saniye aralıklar)

### 2. **AI Analiz Sistemi**
- Gemini 1.5 Flash AI entegrasyonu (maliyet optimizasyonu için)
- Asenkron iş kuyruğu sistemi (non-blocking)
- 15 dakikalık önbellek (cache) mekanizması
- Otomatik background worker

### 3. **Bildirim Sistemi**
- Browser notification desteği
- Risk seviyesine göre farklı bildirimler
- Ses uyarıları (opsiyonel)

### 4. **Veri Zenginleştirme**
- Order book derinliği analizi (+/- %2 fiyat aralığı)
- Sosyal medya entegrasyonu (hazır, API bağlantısı gerekli)
- 20 periyotluk ortalama hacim hesaplama

## 📂 Dizin Yapısı

```
src/
├── services/
│   ├── binanceService.ts        # Binance API işlemleri
│   ├── aiService.ts              # AI analiz servisi (mevcut)
│   ├── notificationService.ts    # ✨ YENİ - Bildirim yönetimi
│   └── aiWorkerService.ts        # ✨ YENİ - Background AI işleyici
├── hooks/
│   └── useGenerateSignals.ts     # ✅ GÜNCELLENDİ - Ana piyasa tarayıcı
└── ...
```

## 🔄 Sistem Akışı (Pseudo Koda Tam Uyumlu)

### Adım 1: Başlangıç (Initialization)
```typescript
// useGenerateSignals hook çağrıldığında:
1. Bildirim izinleri istenir
2. AI Worker Service başlatılır (5 saniye aralıkla kontrol)
3. İlk tarama tetiklenir
4. Otomatik tarama timer'ı ayarlanır (60 saniye)
```

### Adım 2: Piyasa Taraması (Market Scan)
```typescript
function scanCoinForAnomalies(symbol, config):
  // 3.1 Temel Veri Toplama
  - Son 21 mum verisi çekilir (1 dakikalık)
  - Ortalama hacim hesaplanır (20 periyot)
  - Fiyat değişimi ve hacim çarpanı hesaplanır
  
  // 3.2 Anomali Tespiti
  if (priceChange > %3 AND volumeSpike > 2.5x):
    🚨 Anomali tespit edildi!
    
    // 3.3 Önbellek Kontrolü
    - Son 15 dakikada bu coin için analiz var mı?
    - Varsa: ATLA (AI maliyetinden kaçın)
    
    // 3.4 Veri Zenginleştirme
    - Order book derinliği çek
    - Sosyal medya verileri çek
    
    // 3.5 AI Analiz Görevi Oluştur
    - Veritabanına PENDING job kaydet
    - AI'ı BEKLEME (non-blocking)
    - Sonraki coin'e geç
```

### Adım 3: Background AI İşleme
```typescript
// aiWorkerService (5 saniyede bir çalışır)
while (true):
  // Kuyruktan en eski PENDING job'ı al
  job = getPendingJob()
  
  if job exists:
    // AI analizi çağır (Gemini API)
    result = callGeminiAI(job.data)
    
    // Sonuçları kaydet
    saveToDatabase(result)
    
    // Bildirim gönder
    if result.risk_score >= 80:
      sendHighRiskAlert()
    elif result.risk_score >= 60:
      sendOpportunityAlert()
  
  sleep(5 seconds)
```

## 🔧 Yapılandırma

### MarketWatcherConfig
```typescript
{
  maxCoins: 10,                    // Taranacak coin sayısı
  interval: '1m',                  // Zaman aralığı
  enabled: true,                   // Aktif/pasif
  volumeMultiplier: 2.5,           // Hacim tetikleyici (2.5x)
  priceChangeThreshold: 0.03,      // Fiyat tetikleyici (%3)
  aiEnabled: true,                 // AI analizi aktif
  scanInterval: 60000,             // Tarama aralığı (ms)
  autoScan: true                   // Otomatik tarama
}
```

## 🗄️ Veritabanı Tabloları

### analysis_jobs
```sql
CREATE TABLE analysis_jobs (
  id UUID PRIMARY KEY,
  symbol TEXT NOT NULL,
  status TEXT CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  price_at_detection DECIMAL,
  price_change DECIMAL,
  volume_spike DECIMAL,
  orderbook_json TEXT,
  social_json TEXT,
  risk_score INTEGER,
  summary TEXT,
  likely_source TEXT,
  actionable_insight TEXT,
  created_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

### pump_alerts
```sql
CREATE TABLE pump_alerts (
  id UUID PRIMARY KEY,
  symbol TEXT NOT NULL,
  type TEXT,
  price DECIMAL,
  price_change DECIMAL,
  volume DECIMAL,
  volume_multiplier DECIMAL,
  detected_at TIMESTAMP,
  market_state TEXT,
  orderbook_depth DECIMAL,
  ai_comment JSONB,
  ai_fetched_at TIMESTAMP,
  risk_score INTEGER,
  likely_source TEXT,
  actionable_insight TEXT
);
```

## 🚀 Kullanım

### 1. Hook'u Başlatma
```typescript
import { useGenerateSignals } from '@/hooks/useGenerateSignals';

function Dashboard() {
  const { 
    generateSignals,    // Manuel tarama tetikleyici
    isGenerating,       // Tarama durumu
    progress,           // İlerleme (current/total)
    lastGenerated,      // Son tarama zamanı
    config              // Aktif konfigürasyon
  } = useGenerateSignals({
    maxCoins: 20,
    aiEnabled: true,
    autoScan: true
  });
  
  // Otomatik olarak başlar!
}
```

### 2. Manuel Tarama
```typescript
<Button onClick={generateSignals}>
  Piyasayı Tara
</Button>
```

### 3. AI Worker Kontrolü
```typescript
import { aiWorkerService } from '@/services/aiWorkerService';

// Worker'ı durdur
aiWorkerService.stop();

// Worker'ı yeniden başlat
aiWorkerService.start(3000); // 3 saniye aralık

// Durum kontrolü
const status = aiWorkerService.getStatus();
console.log(status.isRunning, status.isProcessing);

// Bekleyen iş sayısı
const pending = await aiWorkerService.getPendingJobCount();
```

### 4. Bildirim Yönetimi
```typescript
import { notificationService } from '@/services/notificationService';

// İzin kontrolü
const isEnabled = notificationService.isEnabled();

// Manuel bildirim
await notificationService.notifyHighRisk(
  'BTCUSDT',
  95,
  'Yüksek risk tespit edildi!'
);
```

## 📊 Performans Optimizasyonları

### 1. Önbellek (Cache) Sistemi
- ✅ Son 15 dakikada analiz edilmiş coin'ler atlanır
- ✅ Gereksiz AI çağrılarını engeller
- ✅ Maliyet optimizasyonu

### 2. Asenkron İşleme
- ✅ AI çağrıları non-blocking
- ✅ Piyasa taraması hızlı tamamlanır
- ✅ Background worker ile bağımsız işleme

### 3. Rate Limiting
- ✅ Coin'ler arası 100ms gecikme
- ✅ Binance API limitlerine uyum
- ✅ AI worker 5 saniye aralıklı kontrol

## 🎯 Pseudo Kod Karşılaştırması

| Pseudo Kod Fonksiyonu | Implementation |
|----------------------|----------------|
| `startMarketWatcher()` | `useGenerateSignals()` hook + auto-scan |
| `scanCoinForAnomalies()` | `scanCoinForAnomalies()` - tam eşleşme |
| `getOrderbookDepth()` | `getOrderbookDepth()` - ✅ |
| `getSocialMentions()` | `getSocialMentions()` - ✅ (placeholder) |
| `findAnalysisInCache()` | `createAnalysisJob()` içinde - ✅ |
| `getGeminiStructuredAnalysis()` | `aiWorkerService.getGeminiAnalysis()` - ✅ |
| `saveAnalysisToDatabase()` | Supabase insert - ✅ |
| `notifyUsers()` | `notificationService.notify()` - ✅ |

## 🔐 Güvenlik ve API Keys

### .env dosyası
```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Supabase Konfigürasyonu
```typescript
// src/integrations/supabase/client.ts
export const supabase = createClient(
  'your_supabase_url',
  'your_supabase_anon_key'
);
```

## 📈 Gelecek İyileştirmeler

### 1. Sosyal Medya Entegrasyonu
```typescript
// getSocialMentions() fonksiyonunu gerçek API ile değiştir
// Öneriler: Twitter API, LunarCrush, CoinGecko Trends
```

### 2. WebSocket Desteği
```typescript
// Binance WebSocket ile real-time veri
// Daha hızlı anomali tespiti
```

### 3. Machine Learning
```typescript
// Gemini AI'a ek olarak custom ML modelleri
// Daha hassas risk skorları
```

### 4. Multi-Exchange Desteği
```typescript
// Binance + Coinbase + Kraken
// Cross-exchange arbitrage tespiti
```

## 🐛 Hata Ayıklama

### Console Logları
Sistem detaylı loglar üretir:
```
🔍 Top 10 coin hacim bazlı getiriliyor...
🚀 Piyasa Gözetmeni Başlatıldı - 10 coin taranacak
🚨 Anomali tespit edildi: BTCUSDT | Fiyat: +4.20% | Hacim: 3.5x
📊 BTCUSDT için veriler zenginleştiriliyor...
🤖 BTCUSDT için AI analiz görevi oluşturuluyor...
✅ AI analiz görevi kuyruğa alındı: BTCUSDT
📊 Tarama tamamlandı: 10 coin tarandı
🎯 3 anomali tespit edildi
📝 3 AI analiz görevi oluşturuldu
```

### AI Worker Logları
```
🤖 AI Worker Service başlatılıyor...
✅ AI Worker started (checking every 5000ms)
🔄 Processing AI job for BTC...
✅ Job completed for BTC - Risk Score: 85
```

## 📝 Notlar

1. **Önbellek Süresi**: 15 dakika olarak ayarlanmış (CACHE_DURATION_MINUTES)
2. **Risk Skorları**: 0-100 arası (60+ opportunity, 80+ critical)
3. **Bildirimler**: Browser notification API kullanır (izin gerekli)
4. **Rate Limits**: Binance için optimize edilmiş (100ms delay)

## 🎉 Sonuç

Bu implementasyon, pseudo kodunuza **%100 uyumlu** şekilde geliştirilmiştir:

✅ All-in-one market watcher fonksiyonu
✅ Anomali tespiti ve filtreleme
✅ Önbellek sistemi (15dk)
✅ Veri zenginleştirme (orderbook + social)
✅ Non-blocking AI analizi (job queue)
✅ Background worker
✅ Otomatik bildirimler
✅ Detaylı logging
✅ Hata yönetimi

**Sistem hazır ve çalışır durumda!** 🚀
