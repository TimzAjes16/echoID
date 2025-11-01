// Remote config - in production, fetch from your backend at launch
export interface AppConfig {
  treasuryAddress: string;
  protocolFeeWei: string;
  defaultChainId: number;
  supportedChainIds: number[];
  apiBaseUrl: string;
}

// Default config - Using Arbitrum Nova for lower fees
// Arbitrum Nova: ~$0.05-0.10 per transaction vs Base Sepolia ~$0.20-0.50
const DEFAULT_CONFIG: AppConfig = {
  treasuryAddress: '0x0000000000000000000000000000000000000000', // Replace with actual treasury
  protocolFeeWei: '10000000000000000', // 0.01 ETH (lower fee on Nova)
  defaultChainId: 42170, // Arbitrum Nova (mainnet) - lower fees than Base
  supportedChainIds: [42170, 84532, 1442], // Nova (default), Base Sepolia, Polygon zkEVM
  apiBaseUrl: 'https://api.echoid.app', // Replace with actual API
};

let cachedConfig: AppConfig | null = null;

/**
 * Fetch remote config (call at app launch)
 */
export async function fetchConfig(): Promise<AppConfig> {
  try {
    // In production, fetch from your backend
    const response = await fetch(`${DEFAULT_CONFIG.apiBaseUrl}/config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const config = await response.json();
      cachedConfig = {...DEFAULT_CONFIG, ...config};
      return cachedConfig;
    }
  } catch (error) {
    console.warn('Failed to fetch remote config, using defaults', error);
  }

  cachedConfig = DEFAULT_CONFIG;
  return cachedConfig;
}

/**
 * Get cached config
 */
export function getConfig(): AppConfig {
  return cachedConfig || DEFAULT_CONFIG;
}

/**
 * Convert wei to fiat (simplified - use price oracle in production)
 */
export function weiToFiat(wei: string, ethPriceUsd: number = 2000): string {
  const eth = parseFloat(wei) / 1e18;
  const usd = eth * ethPriceUsd;
  return usd.toFixed(2);
}
