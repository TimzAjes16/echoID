import {sha3_256} from 'js-sha3';

export interface HandleResolution {
  wallet: string;
  devicePubKey: string;
  ensName?: string;
  verified: boolean;
}

export interface QRInvitePayload {
  handle?: string;
  wallet: string;
  devicePubKey: string;
  timestamp: number;
  signature?: string;
  nonce?: string;
}

/**
 * Normalize handle (remove @, lowercase, validate format)
 */
export function normalizeHandle(handle: string): string {
  const normalized = handle.replace(/^@/, '').toLowerCase().trim();
  // Format: alphanumeric + dots, 3-30 chars, no consecutive dots
  if (!/^[a-z0-9]+(\.[a-z0-9]+)*$/.test(normalized)) {
    throw new Error('Invalid handle format. Use letters, numbers, and dots (e.g., alex.wave)');
  }
  if (normalized.length < 3 || normalized.length > 30) {
    throw new Error('Handle must be 3-30 characters');
  }
  if (normalized.includes('..')) {
    throw new Error('Handle cannot contain consecutive dots');
  }
  return normalized;
}

/**
 * Format handle for display (with @ prefix)
 */
export function formatHandle(handle: string): string {
  const normalized = normalizeHandle(handle);
  return `@${normalized}`;
}

/**
 * Validate handle format
 */
export function validateHandle(handle: string): boolean {
  try {
    normalizeHandle(handle);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve handle to wallet address and device pubkey
 * Calls backend API to resolve @handle → {wallet, devicePubKey, ensName?}
 */
export async function resolveHandle(
  handle: string,
  apiBaseUrl: string,
): Promise<HandleResolution> {
  // Check test mode - return test data if API unavailable
  try {
    const {isTestMode, generateTestWalletAddresses} = await import('./testMode');
    const testMode = await isTestMode();
    
    if (testMode) {
      console.log('🧪 TEST MODE: Resolving handle with test data');
      const testWallets = generateTestWalletAddresses();
      return {
        wallet: testWallets.participantB,
        devicePubKey: 'test-device-pub-key',
        verified: true,
      };
    }
  } catch {
    // Continue with live resolution
  }
  const normalized = normalizeHandle(handle);
  const response = await fetch(`${apiBaseUrl}/api/handles/${normalized}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Handle not found: @${normalized}`);
  }

  const data = await response.json();
  return {
    wallet: data.wallet,
    devicePubKey: data.devicePubKey,
    ensName: data.ensName,
    verified: data.verified || false,
  };
}

/**
 * Verify handle binding signature
 * Challenge-response to prevent spoofing
 */
export async function verifyHandleBinding(
  handle: string,
  wallet: string,
  signature: string,
  apiBaseUrl: string,
): Promise<boolean> {
  const normalized = normalizeHandle(handle);
  const response = await fetch(`${apiBaseUrl}/api/handles/${normalized}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      wallet,
      signature,
    }),
  });

  return response.ok;
}

/**
 * Register/claim handle
 */
export async function registerHandle(
  handle: string,
  wallet: string,
  devicePubKey: string,
  signature: string,
  apiBaseUrl: string,
): Promise<{success: boolean; message?: string}> {
  const normalized = normalizeHandle(handle);
  const response = await fetch(`${apiBaseUrl}/api/handles/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      handle: normalized,
      wallet,
      devicePubKey,
      signature,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to register handle');
  }

  return {success: true};
}

/**
 * Encode QR invite payload
 */
export function encodeQRInvite(payload: QRInvitePayload): string {
  const json = JSON.stringify(payload);
  // Base64 encode for QR
  return Buffer.from(json).toString('base64');
}

/**
 * Decode QR invite payload
 */
export function decodeQRInvite(encoded: string): QRInvitePayload {
  try {
    const json = Buffer.from(encoded, 'base64').toString();
    const payload = JSON.parse(json);
    return payload;
  } catch (error) {
    throw new Error('Invalid QR invite format');
  }
}

/**
 * Generate QR deep link URL
 */
export function generateDeepLink(type: 'user' | 'invite', identifier: string): string {
  if (type === 'user') {
    const normalized = identifier.replace(/^@/, '');
    return `echoid://u/${normalized}`;
  } else {
    return `echoid://invite/${identifier}`;
  }
}

/**
 * Parse deep link
 */
export function parseDeepLink(url: string): {
  type: 'user' | 'invite' | 'consent' | 'unknown';
  identifier: string;
} | null {
  const match = url.match(/echoid:\/\/(u|invite|consent)\/([^\/]+)/);
  if (!match) {
    return null;
  }

  const [, type, identifier] = match;
  return {
    type: type === 'u' ? 'user' : type === 'invite' ? 'invite' : 'consent',
    identifier,
  };
}
