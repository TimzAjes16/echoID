/**
 * Expo-compatible authentication module
 * Uses expo-secure-store instead of react-native-encrypted-storage
 */

import * as SecureStore from 'expo-secure-store';
import {createWallet} from './wallet';
import {generateDeviceKey} from '../crypto/expo-index';

export interface User {
  username: string;
  email?: string;
  walletAddress: string;
  createdAt: number;
  deviceKeyPublic: string;
}

const AUTH_STORAGE_KEY = 'echoid-auth';
const USER_STORAGE_KEY = 'echoid-user';

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string, apiBaseUrl?: string): Promise<{
  available: boolean;
  reason?: string;
}> {
  try {
    if (!username || username.trim().length < 3) {
      return {available: false, reason: 'Username must be at least 3 characters'};
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(username.trim())) {
      return {available: false, reason: 'Username can only contain letters, numbers, dots, underscores, and hyphens'};
    }

    const normalized = username.toLowerCase().trim();

    // Check local storage
    try {
      const userData = await SecureStore.getItemAsync(USER_STORAGE_KEY);
      if (userData) {
        const user = JSON.parse(userData) as User;
        if (user.username === normalized) {
          return {available: false, reason: 'Username already taken'};
        }
      }
    } catch {
      // Continue to backend check
    }

    // Check backend if API URL provided
    if (apiBaseUrl) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/usernames/check`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({username: normalized}),
        });

        if (response.ok) {
          const data = await response.json();
          return {available: data.available === true, reason: data.reason};
        }
      } catch (error) {
        console.warn('Backend username check failed, using local check only:', error);
      }
    }

    return {available: true};
  } catch (error: any) {
    return {available: false, reason: error?.message || 'Unknown error'};
  }
}

/**
 * Sign up: Create username and wallet
 */
export async function signUp(username: string, email?: string): Promise<{
  username: string;
  walletAddress: string;
  mnemonic?: string;
}> {
  try {
    if (!username || username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters');
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(username.trim())) {
      throw new Error('Username can only contain letters, numbers, dots, underscores, and hyphens');
    }

    const normalized = username.toLowerCase().trim();

    // Check if username is available
    const {getConfig} = await import('./config');
    const config = getConfig();
    const availability = await isUsernameAvailable(normalized, config.apiBaseUrl);
    
    if (!availability.available) {
      throw new Error(availability.reason || 'Username already taken');
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format');
    }

    // Generate device key
    let deviceKey;
    try {
      deviceKey = await generateDeviceKey('echoid-device');
      console.log('✅ Device key generated:', deviceKey.publicKey.slice(0, 20) + '...');
    } catch (error: any) {
      console.error('Device key generation error:', error);
      deviceKey = {
        publicKey: Buffer.from(`mock-device-key-${Date.now()}`).toString('base64'),
        label: 'echoid-device',
      };
    }

    // Create wallet
    let wallet;
    try {
      wallet = await createWallet();
      console.log('✅ Wallet created:', wallet.address);
    } catch (error: any) {
      console.error('Wallet creation error:', error);
      throw new Error(`Wallet creation failed: ${error?.message || error}. Please try again.`);
    }

    // Store user data
    const user: User = {
      username: normalized,
      email: email?.toLowerCase().trim(),
      walletAddress: wallet.address,
      createdAt: Date.now(),
      deviceKeyPublic: deviceKey.publicKey,
    };

    try {
      await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(user));
      await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify({username: user.username, loggedIn: true}));
      console.log('✅ User data stored');
    } catch (storageError: any) {
      console.error('Storage error:', storageError);
      throw new Error(`Failed to store user data: ${storageError?.message || storageError}`);
    }

    return {
      username: user.username,
      walletAddress: wallet.address,
      mnemonic: wallet.mnemonic,
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw new Error(`Sign up failed: ${error?.message || error}`);
  }
}

/**
 * Login: Restore user session
 */
export async function login(identifier: string): Promise<User | null> {
  try {
    const normalized = identifier.toLowerCase().trim();
    const isEmail = normalized.includes('@');
    
    let usernameToFind: string | null = null;
    
    if (isEmail) {
      // Find username by email
      try {
        const username = await SecureStore.getItemAsync(`echoid-email-${normalized}`);
        if (username) {
          usernameToFind = username;
        }
      } catch {
        // Email not found
      }
    } else {
      usernameToFind = normalized;
    }

    if (!usernameToFind) {
      return null;
    }

    // Get user data
    const userData = await SecureStore.getItemAsync(USER_STORAGE_KEY);
    if (!userData) {
      return null;
    }

    const user = JSON.parse(userData) as User;
    if (user.username === usernameToFind) {
      // Update auth status
      await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify({username: user.username, loggedIn: true}));
      return user;
    }

    return null;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

/**
 * Get current logged-in user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const authData = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
    if (!authData) {
      return null;
    }

    const auth = JSON.parse(authData);
    if (!auth.loggedIn) {
      return null;
    }

    const userData = await SecureStore.getItemAsync(USER_STORAGE_KEY);
    if (!userData) {
      return null;
    }

    return JSON.parse(userData) as User;
  } catch {
    return null;
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(): Promise<boolean> {
  try {
    const authData = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
    if (!authData) {
      return false;
    }

    const auth = JSON.parse(authData);
    return auth.loggedIn === true;
  } catch {
    return false;
  }
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error('Logout error:', error);
  }
}

/**
 * Update username (if available)
 */
export async function updateUsername(newUsername: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('No user logged in');
  }

  const availability = await isUsernameAvailable(newUsername);
  if (!availability.available) {
    throw new Error(availability.reason || 'Username not available');
  }

  user.username = newUsername.toLowerCase().trim();
  await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(user));
}

/**
 * Recover username from email
 */
export async function recoverUsername(email: string): Promise<string | null> {
  try {
    const normalized = email.toLowerCase().trim();
    const username = await SecureStore.getItemAsync(`echoid-email-${normalized}`);
    return username;
  } catch {
    return null;
  }
}

