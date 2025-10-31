export type CoercionLevel = 'green' | 'amber' | 'red';

export interface CoercionFeatures {
  speechRate: number; // words per minute
  pauseCount: number;
  pauseDuration: number; // average pause in ms
  jitter: number; // voice jitter (0-1)
  volumeVariation: number; // std dev of volume (0-1)
}

export interface CoercionResult {
  level: CoercionLevel;
  score: number; // 0-100, higher = more concerning
  features: CoercionFeatures;
  warnings: string[];
}

/**
 * Heuristic coercion detection based on audio features
 * MVP: simplified heuristics; later: ML model
 */
export function analyzeCoercion(features: CoercionFeatures): CoercionResult {
  const warnings: string[] = [];
  let score = 0;

  // Speech rate too fast (possible rushing)
  if (features.speechRate > 180) {
    score += 20;
    warnings.push('Speech rate is unusually fast');
  }

  // Speech rate too slow (possible hesitation)
  if (features.speechRate < 80) {
    score += 15;
    warnings.push('Speech rate is unusually slow');
  }

  // Many pauses (possible hesitation)
  if (features.pauseCount > 10) {
    score += 15;
    warnings.push('Multiple pauses detected');
  }

  // Long pauses (possible thinking/hesitation)
  if (features.pauseDuration > 2000) {
    score += 20;
    warnings.push('Long pauses detected');
  }

  // High jitter (nervousness or coercion)
  if (features.jitter > 0.3) {
    score += 25;
    warnings.push('Voice jitter suggests stress or nervousness');
  }

  // High volume variation (possible interruption or coercion)
  if (features.volumeVariation > 0.4) {
    score += 15;
    warnings.push('Inconsistent volume detected');
  }

  // Determine level
  let level: CoercionLevel;
  if (score >= 60) {
    level = 'red';
  } else if (score >= 30) {
    level = 'amber';
  } else {
    level = 'green';
  }

  return {
    level,
    score: Math.min(100, score),
    features,
    warnings,
  };
}

/**
 * Extract features from audio buffer (mock for MVP)
 * TODO: Replace with real audio analysis
 */
export async function extractAudioFeatures(
  audioBuffer: ArrayBuffer,
): Promise<CoercionFeatures> {
  // MVP: Mock implementation
  // In production, use Web Audio API or native audio analysis
  const mockFeatures: CoercionFeatures = {
    speechRate: 120 + Math.random() * 40 - 20,
    pauseCount: Math.floor(Math.random() * 5),
    pauseDuration: 500 + Math.random() * 500,
    jitter: Math.random() * 0.2,
    volumeVariation: Math.random() * 0.3,
  };

  return mockFeatures;
}
