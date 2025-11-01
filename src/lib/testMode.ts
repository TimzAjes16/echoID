/**
 * Test Mode Configuration
 * Allows running the app with test data when contracts aren't deployed
 * Uses expo-secure-store for Expo Go compatibility
 */

import * as SecureStore from 'expo-secure-store';

const TEST_MODE_KEY = 'echoid-test-mode';

/**
 * Enable or disable test mode
 */
export async function setTestMode(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(TEST_MODE_KEY, JSON.stringify(enabled));
}

/**
 * Check if test mode is enabled
 */
export async function isTestMode(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(TEST_MODE_KEY);
    if (value === null) {
      // Default to test mode if not set (for development)
      return true;
    }
    return JSON.parse(value) === true;
  } catch {
    return false;
  }
}

/**
 * Generate test data for handshake
 */
export function generateTestHandshakeData() {
  // Generate deterministic test hashes
  const timestamp = Date.now().toString();
  const testVoiceHash = `0x${'a'.repeat(64)}`; // 32 bytes in hex
  const testFaceHash = `0x${'b'.repeat(64)}`;
  const testDeviceHash = `0x${'c'.repeat(64)}`;
  const testGeoHash = `0x${'d'.repeat(64)}`;

  return {
    voiceHash: testVoiceHash,
    faceHash: testFaceHash,
    deviceHash: testDeviceHash,
    geoHash: testGeoHash,
    timestamp,
  };
}

/**
 * Generate test wallet addresses
 */
export function generateTestWalletAddresses() {
  return {
    participantA: '0x1111111111111111111111111111111111111111',
    participantB: '0x2222222222222222222222222222222222222222',
    treasury: '0x3333333333333333333333333333333333333333',
  };
}

/**
 * Generate test transaction hash
 */
export function generateTestTxHash(): string {
  return `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`;
}

/**
 * Simulate transaction confirmation delay
 */
export function simulateTxConfirmation(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 2000); // 2 second delay
  });
}

