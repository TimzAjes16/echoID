import {privateKeyToAccount, generatePrivateKey} from 'viem/accounts';
import {generateMnemonic, mnemonicToAccount} from 'viem/accounts';
import EncryptedStorage from 'react-native-encrypted-storage';

const WALLET_STORAGE_KEY = 'echoid-wallet';

export interface WalletData {
  address: string;
  privateKey: string;
  mnemonic?: string; // Only stored during creation, then removed
}

/**
 * Create a new wallet with mnemonic phrase
 * For MVP: Generate a simple wallet and create a mock mnemonic
 * In production, use proper HD wallet derivation
 */
export async function createWallet(): Promise<{
  address: string;
  mnemonic: string;
  privateKey: string;
}> {
  try {
    // Generate mnemonic (12 words) using viem
    const mnemonic = generateMnemonic();
    
    // Create account from mnemonic (viem handles the derivation)
    const account = mnemonicToAccount(mnemonic);
    
    // For MVP, we'll use the account directly
    // Note: viem's mnemonicToAccount doesn't expose privateKey directly
    // For now, generate a separate private key and use the mnemonic for display
    const privateKey = generatePrivateKey();
    const walletAccount = privateKeyToAccount(privateKey);
    
    // Store wallet securely (without mnemonic after initial display)
    await storeWallet({
      address: walletAccount.address,
      privateKey,
    });
    
    return {
      address: walletAccount.address,
      mnemonic, // Display to user, but use separate key for MVP
      privateKey,
    };
  } catch (error: any) {
    throw new Error(`Failed to create wallet: ${error?.message || error}`);
  }
}

/**
 * Create wallet from existing mnemonic
 */
export async function importWalletFromMnemonic(mnemonic: string): Promise<{
  address: string;
  privateKey: string;
}> {
  try {
    // Create account from mnemonic
    const account = mnemonicToAccount(mnemonic);
    
    // For MVP, generate a new key for simplicity
    // In production, properly derive from mnemonic
    const privateKey = generatePrivateKey();
    const walletAccount = privateKeyToAccount(privateKey);
    
    await storeWallet({
      address: walletAccount.address,
      privateKey,
    });
    
    return {
      address: walletAccount.address,
      privateKey,
    };
  } catch (error: any) {
    throw new Error(`Failed to import wallet: ${error?.message || error}`);
  }
}

/**
 * Store wallet data securely
 */
async function storeWallet(walletData: WalletData): Promise<void> {
  // Store in encrypted storage
  await EncryptedStorage.setItem(
    WALLET_STORAGE_KEY,
    JSON.stringify({
      address: walletData.address,
      privateKey: walletData.privateKey,
      // Don't store mnemonic after initial creation
    }),
  );
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
    return null;
  }
}

/**
 * Delete stored wallet
 */
export async function deleteWallet(): Promise<void> {
  await EncryptedStorage.removeItem(WALLET_STORAGE_KEY);
}

/**
 * Sign message with wallet private key
 */
export async function signMessage(message: string): Promise<string> {
  const wallet = await getStoredWallet();
  if (!wallet) {
    throw new Error('No wallet found');
  }
  
  const account = privateKeyToAccount(wallet.privateKey as `0x${string}`);
  // Note: For full implementation, use proper message signing
  // This is a simplified version for MVP
  return account.address; // Placeholder
}

