// Remote config - in production, fetch from your backend at launch
export interface AppConfig {
  treasuryAddress: string;
  protocolFeeWei: string;
  defaultChainId: number;
  supportedChainIds: number[];
  apiBaseUrl: string;
}

// Default config (Base Sepolia)
const DEFAULT_CONFIG: AppConfig = {
  treasuryAddress: '0x0000000000000000000000000000000000000000', // Replace with actual treasury
  protocolFeeWei: '50000000000000000', // 0.05 ETH (adjust for Base)
  defaultChainId: 84532, // Base Sepolia
  supportedChainIds: [84532], // Base Sepolia, can add Nova/zkEVM
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
