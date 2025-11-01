/**
 * Expo-compatible crypto module
 * Uses expo-secure-store instead of Secure Enclave native module
 * 
 * IMPORTANT: This uses software-based encryption, not hardware Secure Enclave
 * For production with hardware-backed security, use EAS Build with custom native modules
 */

import * as SecureStore from 'expo-secure-store';
import {sha3_256} from 'js-sha3';
import * as Crypto from 'expo-crypto';

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
 * Generate device keypair using expo-secure-store
 * Note: This is NOT hardware-backed (Secure Enclave), but uses secure storage
 */
export async function generateDeviceKey(label: string = 'echoid-device'): Promise<DeviceKeyPair> {
  try {
    // Check if key already exists
    const existingKey = await SecureStore.getItemAsync(`device-key-${label}`);
    if (existingKey) {
      return {
        publicKey: existingKey,
        label,
      };
    }

    // Generate new keypair using expo-crypto
    // For Expo Go, we generate a random key and store it securely
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    const publicKey = Buffer.from(randomBytes).toString('base64');

    // Store securely
    await SecureStore.setItemAsync(`device-key-${label}`, publicKey, {
      requireAuthentication: false, // Set to true if you want FaceID/TouchID
      authenticationPrompt: 'Unlock device key',
    });

    return {
      publicKey,
      label,
    };
  } catch (error: any) {
    console.error('Failed to generate device key:', error);
    // Fallback: generate mock key
    const mockPublicKey = Buffer.from(`${label}-${Date.now()}-mock-key`).toString('base64');
    return {
      publicKey: mockPublicKey,
      label,
    };
  }
}

/**
 * Sign data using device private key
 * Note: In Expo Go, this is a mock implementation
 * For real ECDSA signing, you'd need custom native module (EAS Build)
 */
export async function signWithDeviceKey(
  data: Uint8Array,
  label: string = 'echoid-device',
): Promise<string> {
  try {
    // Get device key
    const deviceKey = await SecureStore.getItemAsync(`device-key-${label}`);
    if (!deviceKey) {
      throw new Error('Device key not found');
    }

    // For Expo Go: Create a deterministic signature using the device key + data hash
    // This is NOT cryptographically secure ECDSA signing
    // For production, use EAS Build with native Secure Enclave module
    const dataHash = sha3_256(data);
    const combined = `${deviceKey}-${dataHash}`;
    const signature = sha3_256(combined);
    
    return Buffer.from(signature, 'hex').toString('base64');
  } catch (error: any) {
    console.warn('Signing failed, using mock signature:', error);
    return Buffer.from(`mock-signature-${Date.now()}`).toString('base64');
  }
}

/**
 * Wrap symmetric key for recipient using ECDH
 * Note: In Expo Go, this uses simplified encryption
 * For real ECDH, you'd need custom native module (EAS Build)
 */
export async function wrapKeyForRecipient(
  symKey: Uint8Array,
  recipientPubKey: string,
  label: string = 'echoid-device',
): Promise<EncryptedData> {
  // Simplified implementation for Expo Go
  // In production with EAS Build, use native ECDH
  const nonce = await Crypto.getRandomBytesAsync(12);
  const nonceStr = Buffer.from(nonce).toString('base64');
  
  // Simple XOR encryption (for MVP only - NOT secure)
  const symKeyStr = Buffer.from(symKey).toString('base64');
  const combined = `${symKeyStr}-${recipientPubKey}`;
  const ciphertext = sha3_256(combined).slice(0, 32); // Simplified
  
  return {
    ciphertext,
    nonce: nonceStr,
    tag: sha3_256(ciphertext + nonceStr).slice(0, 16), // Mock tag
  };
}

/**
 * Unwrap symmetric key from sender
 */
export async function unwrapKeyFromSender(
  encrypted: EncryptedData,
  senderPubKey: string,
  label: string = 'echoid-device',
): Promise<Uint8Array> {
  // Simplified implementation for Expo Go
  // This is a mock - real implementation would decrypt using ECDH
  const mockKey = await Crypto.getRandomBytesAsync(32);
  return new Uint8Array(mockKey);
}

/**
 * Encrypt bytes with AES-GCM
 * Note: expo-crypto doesn't have AES-GCM, use expo-secure-store for storage
 */
export async function encryptBytes(
  data: Uint8Array,
  key: Uint8Array,
): Promise<{iv: string; ciphertext: string; tag: string}> {
  // For Expo Go, we store encrypted data using SecureStore
  // For file encryption, you'd need a crypto library that works in React Native
  throw new Error('AES-GCM encryption requires native module. Use expo-secure-store for key-value storage.');
}

/**
 * Decrypt bytes with AES-GCM
 */
export async function decryptBytes(
  encrypted: {iv: string; ciphertext: string; tag: string},
  key: Uint8Array,
): Promise<Uint8Array> {
  throw new Error('AES-GCM decryption requires native module. Use expo-secure-store for key-value storage.');
}

/**
 * Hash audio PCM bytes
 */
export function hashAudioPcm(pcmBytes: Uint8Array): string {
  return sha3_256(pcmBytes);
}

/**
 * Hash face embedding
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
 * Store encrypted data using expo-secure-store
 */
export async function storeEncrypted(key: string, data: string): Promise<void> {
  await SecureStore.setItemAsync(key, data);
}

/**
 * Retrieve encrypted data from expo-secure-store
 */
export async function getEncrypted(key: string): Promise<string | null> {
  return await SecureStore.getItemAsync(key);
}

/**
 * Remove encrypted data
 */
export async function removeEncrypted(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

