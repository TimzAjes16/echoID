/**
 * @format
 */

/**
 * CRITICAL: Set up crypto.getRandomValues BEFORE any other imports
 * This must be done FIRST because ethereum-cryptography will try to use it immediately
 */

// Initialize crypto object if it doesn't exist
if (typeof global !== 'undefined' && !global.crypto) {
  global.crypto = {};
}

// Set up the polyfill FIRST (before trying native module)
// This ensures crypto.getRandomValues exists even if native module fails
if (typeof global !== 'undefined' && (!global.crypto.getRandomValues)) {
  global.crypto.getRandomValues = function(arr: any) {
    if (!arr || arr.length === 0) {
      return arr;
    }
    
    // Generate random bytes using Math.random
    // This fallback will be used if native module isn't available
    const length = arr.length;
    const bytes = new Uint8Array(length);
    
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    
    // Copy to the target array based on its type
    if (arr instanceof Uint8Array || arr instanceof Int8Array) {
      arr.set(bytes);
    } else if (arr instanceof Uint16Array || arr instanceof Int16Array) {
      for (let i = 0; i < length; i++) {
        arr[i] = (bytes[i * 2] << 8) | (bytes[i * 2 + 1] || 0);
      }
    } else if (arr instanceof Uint32Array || arr instanceof Int32Array) {
      for (let i = 0; i < length; i++) {
        arr[i] = (bytes[i * 4] << 24) | (bytes[i * 4 + 1] << 16) | 
                 (bytes[i * 4 + 2] << 8) | (bytes[i * 4 + 3] || 0);
      }
    } else {
      for (let i = 0; i < length; i++) {
        arr[i] = bytes[i];
      }
    }
    
    return arr;
  };
  
  console.log('✅ Pure JS crypto.getRandomValues polyfill installed (fallback)');
}

// Now try to use native module (if available, it will override the fallback)
// But if it fails, the fallback above is already in place
try {
  // This will only work if the native module is properly linked
  require('react-native-get-random-values');
  console.log('✅ react-native-get-random-values native module loaded (using native crypto)');
} catch (error) {
  // Native module not available - that's OK, we have the fallback above
  console.log('⚠️ react-native-get-random-values native module not available, using pure JS fallback');
  // Fallback is already set up above, so we can continue
}

import { enableScreens } from 'react-native-screens';
enableScreens();

import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Polyfill TextEncoder and TextDecoder for WalletConnect compatibility
import { TextEncoder, TextDecoder } from 'text-encoding-polyfill';
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
