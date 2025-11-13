// AI Service using Google Gemini for crypto pump analysis

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export interface AIAnalysisResult {
  isOrganic: boolean;
  whaleMovementProbability: number; // 0-100
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  riskAnalysis: string;
  tradingAdvice: string;
  warningSignals: string[];
  marketState: string;
}

export interface PumpAnalysisInput {
  symbol: string;
  price: number;
  priceChange: number;
  volume: number;
  avgVolume: number;
  volumeMultiplier: number;
}

// Analyze if pump is organic or manipulation
export async function analyzePumpWithAI(input: PumpAnalysisInput): Promise<AIAnalysisResult> {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not found, returning default analysis');
    return getDefaultAnalysis(input);
  }

  try {
    const prompt = `You are an expert crypto market analyst. Analyze this pump detection:

Symbol: ${input.symbol}
Current Price: $${input.price}
Price Change: +${input.priceChange.toFixed(2)}%
Current Volume: $${input.volume.toFixed(0)}
Average Volume (20 periods): $${input.avgVolume.toFixed(0)}
Volume Multiplier: ${input.volumeMultiplier.toFixed(2)}x

Market Context: Current market is in a volatile state with mixed sentiment.

Analyze:
1. Is this pump organic or likely manipulation/whale movement?
2. What is the whale movement probability (0-100)?
3. Risk level: Low/Moderate/High/Critical
4. Detailed risk analysis (2-3 sentences)
5. Trading advice (should traders enter, exit, or wait?)
6. Warning signals to watch for

Respond ONLY with a valid JSON object in this exact format:
{
  "isOrganic": true/false,
  "whaleMovementProbability": 0-100,
  "riskLevel": "Low/Moderate/High/Critical",
  "riskAnalysis": "detailed analysis here",
  "tradingAdvice": "specific advice here",
  "warningSignals": ["signal1", "signal2", "signal3"],
  "marketState": "brief market state description"
}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to extract JSON from AI response:', text);
      return getDefaultAnalysis(input);
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Validate and ensure all required fields exist
    return {
      isOrganic: analysis.isOrganic ?? false,
      whaleMovementProbability: analysis.whaleMovementProbability ?? 50,
      riskLevel: analysis.riskLevel ?? 'Moderate',
      riskAnalysis: analysis.riskAnalysis ?? 'Analysis unavailable',
      tradingAdvice: analysis.tradingAdvice ?? 'Proceed with caution',
      warningSignals: Array.isArray(analysis.warningSignals) ? analysis.warningSignals : ['Monitor closely'],
      marketState: analysis.marketState ?? 'Mixed market conditions'
    };

  } catch (error) {
    console.error('Error getting AI analysis:', error);
    return getDefaultAnalysis(input);
  }
}

// Get default analysis when AI is unavailable
function getDefaultAnalysis(input: PumpAnalysisInput): AIAnalysisResult {
  const isHighVolume = input.volumeMultiplier > 4.0;
  const isHighPriceChange = input.priceChange > 5.0;
  
  let riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Moderate';
  let whaleMovementProbability = 50;

  if (isHighVolume && isHighPriceChange) {
    riskLevel = 'High';
    whaleMovementProbability = 75;
  } else if (isHighVolume || isHighPriceChange) {
    riskLevel = 'Moderate';
    whaleMovementProbability = 60;
  } else {
    riskLevel = 'Low';
    whaleMovementProbability = 30;
  }

  let tradingAdvice: string;
  switch (riskLevel) {
    case 'High':
      tradingAdvice = 'High risk detected. Wait for confirmation and avoid FOMO entries. Consider taking profits if already in position.';
      break;
    case 'Critical':
      tradingAdvice = 'Critical risk detected. Immediate exit recommended. This appears to be manipulation.';
      break;
    case 'Moderate':
      tradingAdvice = 'Moderate opportunity. Enter with tight stop-loss and defined risk. Monitor for volume continuation.';
      break;
    case 'Low':
      tradingAdvice = 'Lower risk entry possible. Set proper risk management and watch for trend development.';
      break;
    default:
      tradingAdvice = 'Proceed with caution and monitor closely.';
  }

  return {
    isOrganic: input.volumeMultiplier < 3.5 && input.priceChange < 5.0,
    whaleMovementProbability,
    riskLevel,
    riskAnalysis: `Detected ${input.priceChange.toFixed(1)}% price increase with ${input.volumeMultiplier.toFixed(1)}x volume spike. ${isHighVolume ? 'Abnormal volume suggests possible whale activity.' : 'Volume levels within acceptable range.'} Monitor for continuation or reversal signals.`,
    tradingAdvice,
    warningSignals: [
      isHighVolume ? 'Abnormally high volume spike' : 'Volume within normal range',
      isHighPriceChange ? 'Rapid price movement' : 'Gradual price increase',
      'Monitor order book depth',
      'Watch for sudden reversals'
    ],
    marketState: 'Current market conditions show mixed signals with moderate volatility'
  };
}

// Batch analyze multiple pumps
export async function batchAnalyzePumps(
  inputs: PumpAnalysisInput[],
  delayMs: number = 1000
): Promise<Map<string, AIAnalysisResult>> {
  const results = new Map<string, AIAnalysisResult>();
  
  for (const input of inputs) {
    const analysis = await analyzePumpWithAI(input);
    results.set(input.symbol, analysis);
    
    // Add delay between API calls to avoid rate limits
    if (inputs.length > 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

// Quick risk assessment without full AI analysis
export function quickRiskAssessment(input: PumpAnalysisInput): {
  riskLevel: string;
  shouldAlert: boolean;
} {
  const volumeScore = Math.min(input.volumeMultiplier / 5, 1) * 40;
  const priceScore = Math.min(input.priceChange / 10, 1) * 60;
  const totalScore = volumeScore + priceScore;
  
  let riskLevel = 'Low';
  let shouldAlert = false;
  
  if (totalScore > 75) {
    riskLevel = 'Critical';
    shouldAlert = true;
  } else if (totalScore > 60) {
    riskLevel = 'High';
    shouldAlert = true;
  } else if (totalScore > 40) {
    riskLevel = 'Moderate';
    shouldAlert = true;
  }
  
  return { riskLevel, shouldAlert };
}
