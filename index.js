/**
 * @format
 */

// IMPORTANT: Must be imported FIRST before any other imports that use crypto
try {
  require('react-native-get-random-values');
} catch (error) {
  // Fallback if native module not linked - polyfill will be set up in wallet.ts
  console.warn('react-native-get-random-values not linked, using fallback');
  if (typeof global !== 'undefined' && !global.crypto) {
    global.crypto = {};
  }
  if (typeof global !== 'undefined' && (!global.crypto.getRandomValues)) {
    global.crypto.getRandomValues = function(arr) {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    };
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
