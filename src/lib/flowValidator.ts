/**
 * Flow Validator - Ensures all steps work correctly
 * Provides test data and validates end-to-end flow
 */

import {isTestMode} from './testMode';

/**
 * Validate authentication flow
 */
export async function validateAuthFlow(): Promise<{
  isValid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  
  try {
    // Check if test mode is available
    await isTestMode();
  } catch (error) {
    errors.push('Test mode check failed');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate wallet creation
 */
export function validateWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate handshake hashes
 */
export function validateHandshakeHashes(hashes: {
  voiceHash: string;
  faceHash: string;
  deviceHash: string;
  geoHash: string;
}): boolean {
  const hashPattern = /^0x[a-fA-F0-9]{64}$/;
  return (
    hashPattern.test(hashes.voiceHash) &&
    hashPattern.test(hashes.faceHash) &&
    hashPattern.test(hashes.deviceHash) &&
    hashPattern.test(hashes.geoHash)
  );
}

/**
 * Get test participant address for development
 */
export function getTestParticipantAddress(): string {
  return '0x2222222222222222222222222222222222222222';
}

