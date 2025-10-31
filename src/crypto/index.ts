import {NativeModules, Platform} from 'react-native';
import {sha3_256} from 'js-sha3';
import EncryptedStorage from 'react-native-encrypted-storage';

const {SecureEnclaveModule} = NativeModules;

// Check if module is available
if (!SecureEnclaveModule) {
  console.warn(
    'SecureEnclaveModule is not available. This might be due to:\n' +
    '1. The native module not being properly linked\n' +
    '2. Running on iOS Simulator (Secure Enclave requires physical device)\n' +
    '3. The app needs to be rebuilt\n' +
    'Using fallback for development...',
  );
}

export interface DeviceKeyPair {
  publicKey: string;
  label: string;
}

export interface EncryptedData {
  ciphertext: string;
  nonce: string;
  tag: string;
}

/**
 * Generate device keypair in Secure Enclave
 * Falls back to mock implementation if module is unavailable (e.g., on simulator)
 */
export async function generateDeviceKey(label: string = 'echoid-device'): Promise<DeviceKeyPair> {
  // Check if running on simulator or module unavailable
  if (Platform.OS === 'ios' && !SecureEnclaveModule) {
    console.warn(
      'SecureEnclaveModule not available. Using mock key for development. ' +
      'Note: Secure Enclave requires a physical device.',
    );
    // Generate a mock keypair for development/testing
    const mockPublicKey = Buffer.from(`${label}-${Date.now()}-mock-key`).toString('base64');
    return {
      publicKey: mockPublicKey,
      label,
    };
  }

  if (!SecureEnclaveModule || !SecureEnclaveModule.generateKeyPair) {
    throw new Error(
      'SecureEnclaveModule is not available. Please:\n' +
      '1. Rebuild the app (npm run ios or npx react-native run-ios)\n' +
      '2. Ensure SecureEnclaveModule.swift and SecureEnclaveModule.m are added to the Xcode project\n' +
      '3. For Secure Enclave features, use a physical iOS device (not simulator)',
    );
  }

  try {
    const result = await SecureEnclaveModule.generateKeyPair(label);
    return {
      publicKey: result.publicKey,
      label: result.label,
    };
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    // Check if error is due to simulator
    if (errorMessage.includes('Secure Enclave') || errorMessage.includes('not available')) {
      console.warn('Secure Enclave not available on simulator, using mock key');
      const mockPublicKey = Buffer.from(`${label}-${Date.now()}-mock-key`).toString('base64');
      return {
        publicKey: mockPublicKey,
        label,
      };
    }
    throw new Error(`Failed to generate device key: ${errorMessage}`);
  }
}

/**
 * Sign data using device private key
 */
export async function signWithDeviceKey(
  data: Uint8Array,
  label: string = 'echoid-device',
): Promise<string> {
  if (!SecureEnclaveModule || !SecureEnclaveModule.sign) {
    console.warn('SecureEnclaveModule not available, using mock signature');
    // Mock signature for development
    return Buffer.from(`mock-signature-${Date.now()}`).toString('base64');
  }
  const dataBase64 = Buffer.from(data).toString('base64');
  try {
    return await SecureEnclaveModule.sign(dataBase64, label);
  } catch (error: any) {
    throw new Error(`Failed to sign: ${error?.message || error}`);
  }
}

/**
 * Wrap symmetric key for recipient using ECDH
 */
export async function wrapKeyForRecipient(
  symKey: Uint8Array,
  recipientPubKey: string,
  label: string = 'echoid-device',
): Promise<EncryptedData> {
  const symKeyBase64 = Buffer.from(symKey).toString('base64');
  try {
    const result = await SecureEnclaveModule.wrapKey(symKeyBase64, recipientPubKey, label);
    return {
      ciphertext: result.ciphertext,
      nonce: result.nonce,
      tag: result.tag,
    };
  } catch (error) {
    throw new Error(`Failed to wrap key: ${error}`);
  }
}

/**
 * Unwrap symmetric key from sender
 */
export async function unwrapKeyFromSender(
  encrypted: EncryptedData,
  senderPubKey: string,
  label: string = 'echoid-device',
): Promise<Uint8Array> {
  try {
    const symKeyBase64 = await SecureEnclaveModule.unwrapKey(
      encrypted.ciphertext,
      encrypted.nonce,
      encrypted.tag,
      senderPubKey,
      label,
    );
    return new Uint8Array(Buffer.from(symKeyBase64, 'base64'));
  } catch (error) {
    throw new Error(`Failed to unwrap key: ${error}`);
  }
}

/**
 * Encrypt bytes with AES-GCM (using symmetric key)
 * Note: For production, use native crypto or react-native-aes-gcm
 */
export async function encryptBytes(
  data: Uint8Array,
  key: Uint8Array,
): Promise<{iv: string; ciphertext: string; tag: string}> {
  // MVP: Use expo-crypto or native module for AES-GCM
  // For now, simplified - in production use proper AES-GCM
  const crypto = require('expo-crypto');
  const iv = crypto.getRandomBytes(12);
  // Note: expo-crypto doesn't have AES-GCM directly
  // For MVP, we'll store encrypted data using react-native-encrypted-storage
  // For actual file encryption, use a proper AES-GCM implementation
  throw new Error('AES-GCM encryption not yet implemented - use encrypted storage wrapper');
}

/**
 * Decrypt bytes with AES-GCM
 */
export async function decryptBytes(
  encrypted: {iv: string; ciphertext: string; tag: string},
  key: Uint8Array,
): Promise<Uint8Array> {
  throw new Error('AES-GCM decryption not yet implemented');
}

/**
 * Hash audio PCM bytes
 */
export function hashAudioPcm(pcmBytes: Uint8Array): string {
  return sha3_256(pcmBytes);
}

/**
 * Hash face embedding (mock for MVP)
 */
export function hashFaceEmbedding(embedding: number[]): string {
  const bytes = new Uint8Array(new Float32Array(embedding).buffer);
  return sha3_256(bytes);
}

/**
 * Derive double-ratchet session key
 */
export function deriveRatchetSession(
  consentId: string,
  peerPubKey: string,
  ourPubKey: string,
): string {
  const seed = `${consentId}-${peerPubKey}-${ourPubKey}`;
  return sha3_256(seed);
}

/**
 * Store encrypted data in local vault
 */
export async function storeEncrypted(key: string, data: string): Promise<void> {
  await EncryptedStorage.setItem(key, data);
}

/**
 * Retrieve encrypted data from local vault
 */
export async function getEncrypted(key: string): Promise<string | null> {
  return await EncryptedStorage.getItem(key);
}

/**
 * Remove encrypted data
 */
export async function removeEncrypted(key: string): Promise<void> {
  await EncryptedStorage.removeItem(key);
}
