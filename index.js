/**
 * @format
 */

// CRITICAL: Must be imported FIRST before any other imports that use crypto
// This ensures crypto.getRandomValues is available for all cryptographic operations
if (typeof global !== 'undefined' && !global.crypto) {
  global.crypto = {};
}

// Try to use native module first, fall back to pure JS if unavailable
let usingNativeModule = false;
try {
  // Import the native module
  require('react-native-get-random-values');
  usingNativeModule = true;
  console.log('✅ react-native-get-random-values native module loaded');
} catch (error) {
  // Native module not available - set up pure JavaScript fallback
  console.warn('⚠️ react-native-get-random-values not available, using pure JS fallback');
  
  // Pure JavaScript implementation of getRandomValues
  // Note: This is less secure than the native implementation but works for development
  if (typeof global !== 'undefined' && (!global.crypto.getRandomValues)) {
    // Use a more robust fallback that works with typed arrays
    global.crypto.getRandomValues = function(arr) {
      if (!arr || !arr.length) {
        return arr;
      }
      
      // Generate random bytes using Math.random
      // For production, this should be replaced with the native module
      const randomValues = new Uint8Array(arr.length);
      for (let i = 0; i < arr.length; i++) {
        randomValues[i] = Math.floor(Math.random() * 256);
      }
      
      // Copy to the target array (supports both Uint8Array and regular arrays)
      if (arr instanceof Uint8Array || arr instanceof Int8Array) {
        arr.set(randomValues);
      } else {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = randomValues[i];
        }
      }
      
      return arr;
    };
    
    console.log('✅ Pure JS crypto.getRandomValues polyfill installed');
  }
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
