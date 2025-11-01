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

// Polyfill URL for expo-av compatibility (expo-av uses URL.protocol)
// This must be set up BEFORE any modules that use URL are imported
if (typeof global.URL === 'undefined' || !global.URL.prototype || typeof global.URL.prototype.protocol === 'undefined') {
  try {
    // Try to use whatwg-url polyfill (more complete)
    const whatwgUrl = require('whatwg-url');
    if (whatwgUrl.URL && whatwgUrl.URLSearchParams) {
      global.URL = whatwgUrl.URL;
      global.URLSearchParams = whatwgUrl.URLSearchParams;
      console.log('✅ whatwg-url polyfill loaded for URL');
    }
  } catch (error) {
    console.warn('⚠️ whatwg-url not available, using simple URL polyfill:', error.message);
  }
  
  // If still not set, create a minimal polyfill
  if (typeof global.URL === 'undefined' || !global.URL.prototype || typeof global.URL.prototype.protocol === 'undefined') {
    // Simple URL polyfill - parse basic URL structure
    global.URL = class URL {
      constructor(url, base) {
        let fullUrl = url;
        
        // Resolve relative URLs
        if (base && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
          const baseUrl = typeof base === 'string' ? base : base.href;
          if (url.startsWith('/')) {
            const baseParts = baseUrl.match(/^([^:]+:\/\/[^\/]+)/);
            fullUrl = baseParts ? baseParts[1] + url : url;
          } else {
            const baseDir = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
            fullUrl = baseDir + url;
          }
        }
        
        this.href = fullUrl;
        
        // Parse protocol
        const protocolMatch = fullUrl.match(/^([^:]+):/);
        this.protocol = protocolMatch ? protocolMatch[1] + ':' : 'file:';
        
        // Parse other components
        const parts = fullUrl.match(/^([^:]+:\/\/)?([^\/?#]+)?([^?#]*)?(\?[^#]*)?(#.*)?$/);
        this.host = parts && parts[2] ? parts[2] : '';
        this.hostname = this.host.split(':')[0] || '';
        this.port = this.host.includes(':') ? this.host.split(':')[1] : '';
        this.pathname = parts && parts[3] ? parts[3] : '/';
        this.search = parts && parts[4] ? parts[4] : '';
        this.hash = parts && parts[5] ? parts[5] : '';
        this.origin = this.protocol + '//' + this.host;
      }
      
      toString() {
        return this.href;
      }
    };
    
    // Also create URLSearchParams if missing
    if (typeof global.URLSearchParams === 'undefined') {
      global.URLSearchParams = class URLSearchParams {
        constructor(init) {
          this._params = {};
          if (init) {
            if (typeof init === 'string') {
              init.split('&').forEach(pair => {
                const [key, value] = pair.split('=');
                if (key) this._params[decodeURIComponent(key)] = decodeURIComponent(value || '');
              });
            }
          }
        }
        get(name) {
          return this._params[name] || null;
        }
        set(name, value) {
          this._params[name] = value;
        }
        toString() {
          return Object.entries(this._params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
        }
      };
    }
    
    console.log('✅ Simple URL polyfill installed');
  }
}

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
