/**
 * @format
 */

/**
 * CRITICAL: Set up polyfills BEFORE any other imports
 * These must be done FIRST because some modules need them immediately
 */

// Polyfill URL FIRST (before anything imports expo-av)
// expo-av requires URL.protocol which React Native doesn't provide natively
if (typeof global.URL === 'undefined' || (global.URL.prototype && typeof global.URL.prototype.protocol === 'undefined')) {
  try {
    // Try react-native-url-polyfill first (React Native specific)
    require('react-native-url-polyfill/auto');
    console.log('✅ react-native-url-polyfill loaded');
  } catch (error1) {
    try {
      // Fallback to whatwg-url
      const whatwgUrl = require('whatwg-url');
      // whatwg-url v5+ exports differently
      if (whatwgUrl && whatwgUrl.URL) {
        global.URL = whatwgUrl.URL;
        if (whatwgUrl.URLSearchParams) {
          global.URLSearchParams = whatwgUrl.URLSearchParams;
        }
        console.log('✅ whatwg-url polyfill loaded for URL');
      } else if (whatwgUrl && typeof whatwgUrl === 'function') {
        // Some versions export URL directly
        global.URL = whatwgUrl;
        console.log('✅ whatwg-url (function) polyfill loaded');
      }
    } catch (error2) {
    // Fallback: create simple URL polyfill
    global.URL = class URL {
      constructor(url, base) {
        let fullUrl = String(url);
        
        if (base) {
          const baseStr = typeof base === 'string' ? base : base.href || '';
          if (!fullUrl.match(/^[a-z]+:/i)) {
            if (fullUrl.startsWith('/')) {
              const match = baseStr.match(/^([^:]+:\/\/[^\/]+)/);
              fullUrl = match ? match[1] + fullUrl : fullUrl;
            } else {
              const dir = baseStr.substring(0, baseStr.lastIndexOf('/') + 1);
              fullUrl = dir + fullUrl;
            }
          }
        }
        
        this.href = fullUrl;
        const protocolMatch = fullUrl.match(/^([^:]+):/);
        this.protocol = protocolMatch ? protocolMatch[1] + ':' : 'file:';
        
        const match = fullUrl.match(/^([^:]+:\/\/)?([^\/?#]*)?([^?#]*)?(\?[^#]*)?(#.*)?$/);
        this.host = (match && match[2]) || '';
        this.hostname = this.host.split(':')[0];
        this.port = this.host.includes(':') ? this.host.split(':')[1] : '';
        this.pathname = (match && match[3]) || '/';
        this.search = (match && match[4]) || '';
        this.hash = (match && match[5]) || '';
        this.origin = this.protocol + '//' + this.host;
      }
      toString() { return this.href; }
    };
    
    if (typeof global.URLSearchParams === 'undefined') {
      global.URLSearchParams = class URLSearchParams {
        constructor(init) {
          this._params = {};
          if (typeof init === 'string') {
            init.split('&').forEach(p => {
              const [k, v] = p.split('=');
              if (k) this._params[decodeURIComponent(k)] = decodeURIComponent(v || '');
            });
          }
        }
        get(name) { return this._params[name] || null; }
        set(name, value) { this._params[name] = value; }
        toString() {
          return Object.entries(this._params)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');
        }
      };
    }
    console.log('✅ Simple URL polyfill installed');
  }
}

// Initialize crypto object if it doesn't exist
if (typeof global !== 'undefined' && !global.crypto) {
  global.crypto = {};
}

// Set up the polyfill FIRST (before trying native module)
// This ensures crypto.getRandomValues exists even if native module fails
if (typeof global !== 'undefined' && (!global.crypto.getRandomValues)) {
  global.crypto.getRandomValues = function(arr) {
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
import appConfig from './app.json';

// For Expo, the app name is in app.json.expo.name
const appName = appConfig.expo?.name || 'EchoID';

AppRegistry.registerComponent(appName, () => App);
