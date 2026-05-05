import type { AppLanguage } from '@/contexts/LanguageContext';

const causeLabels: Record<string, Record<AppLanguage, string>> = {
  organic_demand: { tr: 'Organik talep', en: 'Organic demand' },
  whale_push: { tr: 'Balina etkisi', en: 'Whale activity' },
  thin_liquidity_move: { tr: 'Düşük likidite hareketi', en: 'Low-liquidity move' },
  fomo_trap: { tr: 'FOMO riski', en: 'FOMO risk' },
  fraud_pump_risk: { tr: 'Manipülasyon riski', en: 'Manipulation risk' },
  news_social_catalyst: { tr: 'Haber veya sosyal katalizör', en: 'News or social catalyst' },
  balanced_market: { tr: 'Dengeli piyasa', en: 'Balanced market' },
};

const riskLabels: Record<string, Record<AppLanguage, string>> = {
  organic_breakout: { tr: 'Organik kırılım', en: 'Organic breakout' },
  fomo_trap: { tr: 'FOMO riski', en: 'FOMO risk' },
  thin_orderbook: { tr: 'Zayıf emir defteri', en: 'Thin order book' },
  possible_whale_push: { tr: 'Olası balina etkisi', en: 'Possible whale activity' },
  low_volume_fake_move: { tr: 'Düşük hacimli hareket', en: 'Low-volume move' },
  high_volume_breakout: { tr: 'Yüksek hacimli kırılım', en: 'High-volume breakout' },
  wick_rejection: { tr: 'Fitil reddi', en: 'Wick rejection' },
  overheated: { tr: 'Aşırı ısınma', en: 'Overheated' },
};

export function formatCauseLabel(value: string | null | undefined, language: AppLanguage) {
  if (!value) return causeLabels.balanced_market[language];
  return causeLabels[value]?.[language] || value.replace(/_/g, ' ');
}

export function formatRiskLabel(value: string, language: AppLanguage) {
  return riskLabels[value]?.[language] || value.replace(/_/g, ' ');
}
