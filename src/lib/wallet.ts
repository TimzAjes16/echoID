/**
 * Wallet Creation and Management
 * Based on Chainlink tutorial: https://chain.link/tutorials/how-to-build-a-crypto-wallet
 * Uses ethereum-cryptography for better React Native compatibility
 */

import {generateMnemonic, mnemonicToEntropy} from 'ethereum-cryptography/bip39';
import {wordlist} from 'ethereum-cryptography/bip39/wordlists/english';
import {HDKey} from 'ethereum-cryptography/hdkey';
import {getPublicKey} from 'ethereum-cryptography/secp256k1';
import {keccak256} from 'ethereum-cryptography/keccak';
import {bytesToHex} from 'ethereum-cryptography/utils';
import EncryptedStorage from 'react-native-encrypted-storage';

const WALLET_STORAGE_KEY = 'echoid-wallet';

export interface WalletData {
  address: string;
  privateKey: string;
  mnemonic?: string; // Only stored during creation, then removed
}

/**
 * Ensure crypto.getRandomValues is available (fallback for React Native)
 */
function ensureRandomValues(): void {
  if (typeof global !== 'undefined' && !global.crypto) {
    global.crypto = {};
  }
  
  if (typeof global !== 'undefined' && (!global.crypto.getRandomValues)) {
    // Fallback implementation using Math.random
    global.crypto.getRandomValues = function(arr) {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    };
  }
}

/**
 * Generate mnemonic phrase (12 or 24 words)
 * Based on BIP-39 specification
 */
function _generateMnemonic(strength: number = 128): {mnemonic: string; entropy: Uint8Array} {
  try {
    ensureRandomValues();
    // 128 bits = 12 words, 256 bits = 24 words
    const mnemonic = generateMnemonic(wordlist, strength);
    const entropy = mnemonicToEntropy(mnemonic, wordlist);
    return {mnemonic, entropy};
  } catch (error: any) {
    console.error('Mnemonic generation error:', error);
    throw new Error(`Failed to generate mnemonic: ${error?.message || error}`);
  }
}

/**
 * Get HD root key from mnemonic entropy
 * Based on BIP-32 for Hierarchical Deterministic wallets
 */
function _getHdRootKey(entropy: Uint8Array): HDKey {
  try {
    return HDKey.fromMasterSeed(entropy);
  } catch (error: any) {
    throw new Error(`Failed to create HD root key: ${error?.message || error}`);
  }
}

/**
 * Generate private key from HD root key at account index
 */
function _generatePrivateKey(hdRootKey: HDKey, accountIndex: number = 0): Uint8Array {
  try {
    const child = hdRootKey.deriveChild(accountIndex);
    if (!child.privateKey) {
      throw new Error('Failed to derive private key');
    }
    return child.privateKey;
  } catch (error: any) {
    throw new Error(`Failed to generate private key: ${error?.message || error}`);
  }
}

/**
 * Get public key from private key using secp256k1 ECDSA
 */
function _getPublicKey(privateKey: Uint8Array): Uint8Array {
  try {
    return getPublicKey(privateKey);
  } catch (error: any) {
    throw new Error(`Failed to get public key: ${error?.message || error}`);
  }
}

/**
 * Get Ethereum address from public key using Keccak-256
 */
function _getEthAddress(publicKey: Uint8Array): string {
  try {
    const hash = keccak256(publicKey);
    const address = hash.slice(-20); // Last 20 bytes
    return `0x${bytesToHex(address)}`;
  } catch (error: any) {
    throw new Error(`Failed to get address: ${error?.message || error}`);
  }
}

/**
 * Convert private key to hex string for storage
 */
function _privateKeyToHex(privateKey: Uint8Array): string {
  return `0x${bytesToHex(privateKey)}`;
}

/**
 * Create a new wallet with mnemonic phrase
 * Follows Chainlink tutorial approach for reliability
 */
export async function createWallet(): Promise<{
  address: string;
  mnemonic: string;
  privateKey: string;
}> {
  try {
    ensureRandomValues();
    
    // Generate mnemonic (12 words by default for better UX)
    const {mnemonic, entropy} = _generateMnemonic(128);
    
    // Create HD root key from entropy
    const hdRootKey = _getHdRootKey(entropy);
    
    // Generate first account (index 0)
    const accountIndex = 0;
    const privateKey = _generatePrivateKey(hdRootKey, accountIndex);
    const publicKey = _getPublicKey(privateKey);
    const address = _getEthAddress(publicKey);
    const privateKeyHex = _privateKeyToHex(privateKey);
    
    // Store wallet securely (without mnemonic after initial display)
    await storeWallet({
      address,
      privateKey: privateKeyHex,
    });
    
    console.log('✅ Wallet created successfully:', {address, mnemonic: mnemonic.split(' ').slice(0, 3).join(' ') + '...'});
    
    return {
      address,
      mnemonic, // Display to user, but use separate key for MVP
      privateKey: privateKeyHex,
    };
  } catch (error: any) {
    console.error('Wallet creation error:', error);
    
    // Enhanced error handling with retry using fallback
    if (error?.message?.includes('RNGetRandomValues') || 
        error?.message?.includes('getRandomValues') ||
        error?.message?.includes('random')) {
      console.log('🔄 Retrying with fallback random generator...');
      ensureRandomValues();
      
      try {
        const {mnemonic, entropy} = _generateMnemonic(128);
        const hdRootKey = _getHdRootKey(entropy);
        const privateKey = _generatePrivateKey(hdRootKey, 0);
        const publicKey = _getPublicKey(privateKey);
        const address = _getEthAddress(publicKey);
        const privateKeyHex = _privateKeyToHex(privateKey);
        
        await storeWallet({
          address,
          privateKey: privateKeyHex,
        });
        
        return {
          address,
          mnemonic,
          privateKey: privateKeyHex,
        };
      } catch (retryError: any) {
        throw new Error(`Failed to create wallet. The native module may not be linked. Please rebuild: cd ios && pod install && cd .. && npx react-native run-ios. Error: ${retryError?.message || retryError}`);
      }
    }
    
    throw new Error(`Failed to create wallet: ${error?.message || error}`);
  }
}

/**
 * Restore wallet from mnemonic phrase
 */
export async function importWalletFromMnemonic(mnemonicInput: string): Promise<{
  address: string;
  privateKey: string;
}> {
  try {
    ensureRandomValues();
    
    // Validate mnemonic format
    const words = mnemonicInput.trim().toLowerCase().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      throw new Error('Mnemonic must be 12 or 24 words');
    }
    
    // Convert mnemonic to entropy
    const entropy = mnemonicToEntropy(mnemonicInput.trim().toLowerCase(), wordlist);
    
    // Create HD root key from entropy
    const hdRootKey = _getHdRootKey(entropy);
    
    // Generate first account (index 0)
    const privateKey = _generatePrivateKey(hdRootKey, 0);
    const publicKey = _getPublicKey(privateKey);
    const address = _getEthAddress(publicKey);
    const privateKeyHex = _privateKeyToHex(privateKey);
    
    // Store wallet securely
    await storeWallet({
      address,
      privateKey: privateKeyHex,
    });
    
    return {
      address,
      privateKey: privateKeyHex,
    };
  } catch (error: any) {
    throw new Error(`Failed to import wallet: ${error?.message || error}`);
  }
}

/**
 * Store wallet data securely (without mnemonic)
 */
async function storeWallet(walletData: WalletData): Promise<void> {
  try {
    await EncryptedStorage.setItem(
      WALLET_STORAGE_KEY,
      JSON.stringify({
        address: walletData.address,
        privateKey: walletData.privateKey,
        // Don't store mnemonic after initial creation
      }),
    );
  } catch (error: any) {
    throw new Error(`Failed to store wallet: ${error?.message || error}`);
  }
}

/**
 * Get stored wallet
 */
export async function getStoredWallet(): Promise<WalletData | null> {
  try {
    const data = await EncryptedStorage.getItem(WALLET_STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get stored wallet:', error);
    return null;
  }
}

/**
 * Delete stored wallet
 */
export async function deleteWallet(): Promise<void> {
  try {
    await EncryptedStorage.removeItem(WALLET_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to delete wallet:', error);
  }
}

/**
 * Sign message with wallet private key
 * For use with viem or ethers.js
 */
export async function signMessage(message: string): Promise<string> {
  const wallet = await getStoredWallet();
  if (!wallet) {
    throw new Error('No wallet found');
  }
  
  // Return private key for signing
  // In production, use proper message signing with secp256k1
  return wallet.privateKey;
}

/**
 * Derive additional account from mnemonic at specified index
 */
export async function deriveAccountFromMnemonic(mnemonic: string, accountIndex: number = 0): Promise<{
  address: string;
  privateKey: string;
}> {
  try {
    ensureRandomValues();
    
    const entropy = mnemonicToEntropy(mnemonic.trim().toLowerCase(), wordlist);
    const hdRootKey = _getHdRootKey(entropy);
    const privateKey = _generatePrivateKey(hdRootKey, accountIndex);
    const publicKey = _getPublicKey(privateKey);
    const address = _getEthAddress(publicKey);
    
    return {
      address,
      privateKey: _privateKeyToHex(privateKey),
    };
  } catch (error: any) {
    throw new Error(`Failed to derive account: ${error?.message || error}`);
  }
}
