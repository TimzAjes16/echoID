const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const path = require('path');

const config = {
  resolver: {
    // Exclude Node.js modules that don't work in React Native
    blockList: [
      /node_modules\/.*\/node_modules\/react-native\/.*/,
    ],
    extraNodeModules: {
      // Mock Node.js modules that some packages try to require
      fs: path.resolve(__dirname, 'src/lib/mocks/fs-mock.js'),
      os: path.resolve(__dirname, 'src/lib/mocks/os-mock.js'),
      path: path.resolve(__dirname, 'src/lib/mocks/path-mock.js'),
      crypto: path.resolve(__dirname, 'src/lib/mocks/crypto-mock.js'),
      stream: path.resolve(__dirname, 'src/lib/mocks/stream-mock.js'),
      // Use buffer polyfill for React Native
      buffer: require.resolve('buffer'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
