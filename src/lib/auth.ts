/**
 * Authentication and User Management
 * Stores username, wallet address, and handles signup/login
 */

// Expo-compatible version - use auth-expo.ts instead
// This file is kept for backwards compatibility but redirects to expo version
export * from './auth-expo';
import {createWallet} from './wallet';
import {generateDeviceKey} from '../crypto';

export interface User {
  username: string;
  email?: string; // Optional email for account recovery
  walletAddress: string;
  createdAt: number;
  deviceKeyPublic: string;
}

const AUTH_STORAGE_KEY = 'echoid-auth';
const USER_STORAGE_KEY = 'echoid-user';

/**
 * Check if username is available (checks both local storage and backend)
 */
export async function isUsernameAvailable(username: string, apiBaseUrl?: string): Promise<{
  available: boolean;
  reason?: string;
}> {
  try {
    // Validate format first
    if (!username || username.trim().length < 3) {
      return {available: false, reason: 'Username must be at least 3 characters'};
    }
    
    if (!/^[a-zA-Z0-9._-]+$/.test(username.trim())) {
      return {available: false, reason: 'Username can only contain letters, numbers, dots, underscores, and hyphens'};
    }

    const normalized = username.toLowerCase().trim();

    // Check local storage first using username index
    try {
      const usernameIndex = await EncryptedStorage.getItem(USERNAME_INDEX_KEY);
      if (usernameIndex) {
        const usernames = JSON.parse(usernameIndex);
        if (usernames.includes(normalized)) {
          return {available: false, reason: 'Username already taken'};
        }
      }
      
      // Also check main user storage as fallback
      const userData = await EncryptedStorage.getItem(USER_STORAGE_KEY);
      if (userData) {
        const user = JSON.parse(userData) as User;
        if (user.username === normalized) {
          return {available: false, reason: 'Username already taken'};
        }
      }
    } catch {
      // If we can't check locally, continue to backend check
    }

    // Check backend if API URL provided
    if (apiBaseUrl) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/usernames/check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
    // Validate username format
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

    // Generate device key (with error handling and fallback)
    let deviceKey;
    try {
      deviceKey = await generateDeviceKey('echoid-device');
      console.log('✅ Device key generated:', deviceKey.publicKey.slice(0, 20) + '...');
      
      // Store device key in Keychain for onboarding detection
      try {
        const Keychain = await import('react-native-keychain');
        await Keychain.default.setGenericPassword('device-key', deviceKey.publicKey, {
          service: 'echoid-device',
        });
        console.log('✅ Device key stored in Keychain');
      } catch (keychainError: any) {
        console.warn('Failed to store device key in Keychain (non-critical):', keychainError);
        // Continue anyway - device key is in memory and will be stored later
      }
    } catch (error: any) {
      console.error('Device key generation error:', error);
      // If device key generation fails (e.g., on simulator), create mock key
      if (error?.message?.includes('Secure Enclave') || error?.message?.includes('simulator')) {
        console.log('⚠️ Using mock device key for development');
        deviceKey = {
          publicKey: Buffer.from(`mock-device-key-${Date.now()}`).toString('base64'),
          label: 'echoid-device',
        };
        
        // Store mock key in Keychain anyway
        try {
          const Keychain = await import('react-native-keychain');
          await Keychain.default.setGenericPassword('device-key', deviceKey.publicKey, {
            service: 'echoid-device',
          });
        } catch (keychainError) {
          // Non-critical
        }
      } else {
        throw new Error(`Device key generation failed: ${error?.message || error}`);
      }
    }

    // Create wallet (with error handling)
    let wallet;
    try {
      wallet = await createWallet();
      console.log('✅ Wallet created:', wallet.address);
      
      // Wallet is already stored by createWallet(), but ensure it's accessible
      // The storeWallet() function is called inside createWallet()
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
      await EncryptedStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      await EncryptedStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({username: user.username, loggedIn: true}));
      console.log('✅ User data stored');
    } catch (storageError: any) {
      console.error('Storage error:', storageError);
      throw new Error(`Failed to store user data: ${storageError?.message || storageError}`);
    }
    
    // Store username in index for quick lookup
    try {
      const usernameIndex = await EncryptedStorage.getItem(USERNAME_INDEX_KEY);
      const usernames = usernameIndex ? JSON.parse(usernameIndex) : [];
      if (!usernames.includes(normalized)) {
        usernames.push(normalized);
        await EncryptedStorage.setItem(USERNAME_INDEX_KEY, JSON.stringify(usernames));
      }
    } catch {
      // Index update failed, continue anyway
    }
    
    // Store email index for username recovery (if email provided)
    if (email) {
      const emailKey = `echoid-email-${email.toLowerCase().trim()}`;
      await EncryptedStorage.setItem(emailKey, normalized);
    }

    return {
      username: user.username,
      walletAddress: wallet.address,
      mnemonic: wallet.mnemonic, // Only returned during signup
    };
  } catch (error: any) {
    throw new Error(`Sign up failed: ${error?.message || error}`);
  }
}

/**
 * Login: Restore user session by username or email
 */
export async function login(identifier: string): Promise<User | null> {
  try {
    const normalized = identifier.toLowerCase().trim();
    
    // Check if identifier is email
    const isEmail = normalized.includes('@');
    
    let usernameToFind: string | null = null;
    
    if (isEmail) {
      // Look up username by email
      const emailKey = `echoid-email-${normalized}`;
      const storedUsername = await EncryptedStorage.getItem(emailKey);
      if (!storedUsername) {
        return null; // Email not found
      }
      usernameToFind = storedUsername;
    } else {
      usernameToFind = normalized;
    }

    // Get user by username
    const allKeys = await EncryptedStorage.getAllKeys();
    for (const key of allKeys) {
      if (key === USER_STORAGE_KEY || key.startsWith('echoid-user-')) {
        try {
          const userData = await EncryptedStorage.getItem(key);
          if (userData) {
            const user = JSON.parse(userData) as User;
            if (user.username === usernameToFind) {
              // Verify auth status
              const authData = await EncryptedStorage.getItem(AUTH_STORAGE_KEY);
              if (authData) {
                const auth = JSON.parse(authData);
                if (auth.loggedIn && auth.username === user.username) {
                  return user;
                }
              }
            }
          }
        } catch {
          // Continue searching
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

/**
 * Recover username from email
 */
export async function recoverUsername(email: string): Promise<string | null> {
  try {
    const normalized = email.toLowerCase().trim();
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error('Invalid email format');
    }

    const emailKey = `echoid-email-${normalized}`;
    const username = await EncryptedStorage.getItem(emailKey);
    
    return username;
  } catch (error) {
    console.error('Username recovery error:', error);
    return null;
  }
}

/**
 * Get current logged in user (from auth session)
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const authData = await EncryptedStorage.getItem(AUTH_STORAGE_KEY);
    if (!authData) {
      return null;
    }

    const auth = JSON.parse(authData);
    if (!auth.loggedIn || !auth.username) {
      return null;
    }

    // Get user by username
    return await login(auth.username);
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(): Promise<boolean> {
  try {
    const authData = await EncryptedStorage.getItem(AUTH_STORAGE_KEY);
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
    await EncryptedStorage.removeItem(AUTH_STORAGE_KEY);
    // Note: We don't remove USER_STORAGE_KEY to allow re-login
    // In production, you might want to clear sensitive data
  } catch (error) {
    console.error('Logout error:', error);
  }
}

/**
 * Update username (requires re-authentication in production)
 */
export async function updateUsername(newUsername: string): Promise<void> {
  try {
    if (!newUsername || newUsername.trim().length < 3) {
      throw new Error('Username must be at least 3 characters');
    }

    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Not logged in');
    }

    user.username = newUsername.toLowerCase();
    await EncryptedStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (error: any) {
    throw new Error(`Update username failed: ${error?.message || error}`);
  }
}

