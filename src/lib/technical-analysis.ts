import { EMA, RSI } from 'technicalindicators';
import { Signal } from '@/types/crypto';

// Binance kline verisi yapısı: [zaman, açılış, yüksek, düşük, kapanış, hacim, ...]
// Bize sadece kapanış fiyatları (indeks 4) gerekiyor.
type Kline = (string | number)[];

export function generateSignal(klines: Kline[]): Signal {
  // 50 periyotluk EMA için yeterli veri yoksa, sinyal üretme.
  if (klines.length < 50) {
    return 'Hold';
  }

  const closePrices = klines.map(kline => parseFloat(kline[4] as string));

  // 1. Kaptan: Ana Trend (50 EMA)
  const ema50 = EMA.calculate({ period: 50, values: closePrices });
  const lastEma50 = ema50[ema50.length - 1];
  const lastPrice = closePrices[closePrices.length - 1];
  const isUptrend = lastPrice > lastEma50;

  // 2. Motor: Momentum (9 EMA vs 21 EMA Kesişimi)
  const ema9 = EMA.calculate({ period: 9, values: closePrices });
  const ema21 = EMA.calculate({ period: 21, values: closePrices });
  
  // Kesişimi teyit etmek için son iki muma bakıyoruz.
  const lastEma9 = ema9[ema9.length - 1];
  const prevEma9 = ema9[ema9.length - 2];
  const lastEma21 = ema21[ema21.length - 1];
  const prevEma21 = ema21[ema21.length - 2];
  
  const bullishCrossover = prevEma9 <= prevEma21 && lastEma9 > lastEma21;
  const bearishCrossover = prevEma9 >= prevEma21 && lastEma9 < lastEma21;

  // 3. Yakıt Göstergesi: Piyasa Duyarlılığı (RSI)
  const rsi = RSI.calculate({ period: 14, values: closePrices });
  const lastRsi = rsi[rsi.length - 1];
  const isNotOverbought = lastRsi < 70;
  const isNotOversold = lastRsi > 30;

  // "Üçlü Teyit" kuralına göre sinyal üret
  if (isUptrend && bullishCrossover && isNotOverbought) {
    return 'Buy';
  }

  if (!isUptrend && bearishCrossover && isNotOversold) {
    return 'Sell';
  }

  return 'Hold';
}